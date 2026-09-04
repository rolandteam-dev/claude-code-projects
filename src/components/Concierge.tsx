"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { site } from "@/lib/site";

type Card = {
  id: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  photo: string | null;
  url: string;
};
type Msg = { role: "user" | "assistant"; content: string; cards?: Card[]; searchUrl?: string };

/** Render inline **bold** and [label](href) markdown as real elements. */
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index).replace(/\*\*/g, ""));
    if (m[1] !== undefined && m[2] !== undefined) {
      const href = m[2].trim();
      const internal = href.startsWith("/");
      nodes.push(
        <a
          key={`${keyBase}-l-${i}`}
          href={href}
          target={internal ? undefined : "_blank"}
          rel={internal ? undefined : "noreferrer"}
          className="font-medium text-[var(--color-gold-3)] underline decoration-[rgba(216,189,132,0.45)] underline-offset-2 hover:decoration-[var(--color-gold-3)]"
        >
          {m[1]}
        </a>,
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <strong key={`${keyBase}-b-${i}`} className="font-semibold text-white">
          {m[3]}
        </strong>,
      );
    }
    last = regex.lastIndex;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last).replace(/\*\*/g, ""));
  return nodes;
}

/** Paragraph-aware rich text for the concierge's replies. */
function RichText({ text }: { text: string }) {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      {paras.map((p, pi) => (
        <p key={pi} className={pi > 0 ? "mt-2" : undefined}>
          {p.split(/\n/).map((line, li) => (
            <span key={li}>
              {li > 0 && <br />}
              {renderInline(line, `${pi}-${li}`)}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Welcome to The Roland Team. I'm your private concierge — ask me about our communities, the Las Vegas luxury market, or tell me what you're looking for and I'll pull live listings. How may I help?",
};

const SUGGESTIONS = [
  "Show me 4-bed homes in Henderson under $2M",
  "What's my home worth?",
  "Explore guard-gated communities",
];

const fmtPrice = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function ListingMini({ card }: { card: Card }) {
  return (
    <a
      href={card.url}
      className="flex gap-3 rounded-[10px] border border-[var(--color-line-dark)] bg-[var(--color-graphite-2)] p-2 no-underline transition-colors hover:border-[rgba(216,189,132,0.45)]"
    >
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[6px] bg-[var(--color-graphite-3)]">
        {card.photo && <Image src={card.photo} alt="" fill sizes="80px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1 self-center">
        <div className="font-sans text-[0.92rem] font-semibold text-white">{fmtPrice(card.price)}</div>
        <div className="font-sans text-[0.72rem] text-[#9aa0aa]">
          {card.beds} bd · {card.baths} ba · {card.sqft.toLocaleString()} sqft
        </div>
        <div className="truncate font-sans text-[0.72rem] text-[#cbcfd6]">{card.address}</div>
      </div>
    </a>
  );
}

export function Concierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [lead, setLead] = useState({ name: "", email: "", phone: "", message: "" });
  const [leadState, setLeadState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [lastUser, setLastUser] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prefill the lead form's hidden message with what they were just asking about,
  // so the team sees real context on the FUB lead.
  function openLead(context?: string) {
    setLead((l) => ({
      ...l,
      message: l.message || (context ? `Concierge chat — interested in: "${context}"` : ""),
    }));
    setShowLead(true);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, showLead]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setLastUser(trimmed);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) }),
      });
      const data = await res.json();
      let reply: string = data.reply ?? "Let me connect you with the team.";
      // The model appends [[LEAD]] (optionally [[LEAD: criteria summary]]) at a
      // natural high-intent moment → open the form, prefilled with the criteria.
      const leadMatch = reply.match(/\[\[\s*LEAD\s*(?::\s*([^\]]+))?\]\]/i);
      const leadSummary = leadMatch?.[1]?.trim();
      reply = reply.replace(/\[\[\s*LEAD\s*(?::[^\]]*)?\]\]/gi, "").trim();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: reply,
          cards: Array.isArray(data.listings) ? data.listings : undefined,
          searchUrl: typeof data.searchUrl === "string" ? data.searchUrl : undefined,
        },
      ]);
      if (leadMatch && leadState !== "done") openLead(leadSummary || trimmed);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `I had trouble responding just now — please call ${site.phone} and we'll help right away.` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!lead.email && !lead.phone) return;
    setLeadState("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          message: lead.message,
          type: "Buyer Inquiry",
          tags: ["Luxury Buyer", "AI Concierge"],
          source: "Luxury Website Chatbot",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setLeadState("done");
        setShowLead(false);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `Thank you${lead.name ? `, ${lead.name.split(" ")[0]}` : ""}. Mike's team has your details and will reach out personally. In the meantime, feel free to keep asking me anything.`,
          },
        ]);
      } else {
        setLeadState("error");
      }
    } catch {
      setLeadState("error");
    }
  }

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open the Roland Team concierge"
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-full bg-[var(--color-graphite)] py-3 pl-3 pr-5 text-white shadow-[0_10px_30px_rgba(20,22,27,0.35)] transition-transform hover:-translate-y-0.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-gold)] font-serif text-[1.1rem] font-medium">
            ✦
          </span>
          <span className="font-sans text-[0.82rem] font-semibold tracking-wide">Concierge</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[60] flex h-[min(620px,80vh)] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[10px] border border-[var(--color-line-dark)] bg-[var(--color-graphite)] text-white shadow-[0_24px_60px_rgba(14,16,20,0.5)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-line-dark)] bg-[var(--color-graphite-3)] px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-gold)] font-serif text-[1rem]">✦</span>
              <div>
                <div className="font-sans text-[0.86rem] font-semibold leading-tight">The Roland Team Concierge</div>
                <div className="font-sans text-[0.68rem] text-[#9aa0aa]">Typically replies instantly</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close concierge" className="text-[#9aa0aa] hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i}>
                <div
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-[12px] rounded-br-sm bg-[var(--color-gold)] px-3.5 py-2.5 font-sans text-[0.9rem] text-white"
                      : "mr-auto max-w-[90%] rounded-[12px] rounded-bl-sm bg-[var(--color-graphite-2)] px-3.5 py-2.5 text-[0.94rem] leading-relaxed text-[#e8eaee]"
                  }
                >
                  {m.role === "assistant" ? <RichText text={m.content} /> : m.content}
                </div>

                {/* Live listing cards + open-in-search (assistant search results) */}
                {m.role === "assistant" && m.cards && m.cards.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {m.cards.map((card) => (
                      <ListingMini key={card.id} card={card} />
                    ))}
                    {m.searchUrl && (
                      <a
                        href={m.searchUrl}
                        className="block rounded-[8px] bg-[var(--color-gold)] py-2.5 text-center font-sans text-[0.8rem] font-semibold text-white no-underline transition-colors hover:bg-[#86692f]"
                      >
                        Open these filters in search →
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="mr-auto flex max-w-[90%] gap-1.5 rounded-[12px] rounded-bl-sm bg-[var(--color-graphite-2)] px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-gold-3)] [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-gold-3)] [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-gold-3)]" />
              </div>
            )}

            {/* Quick suggestions (only before first user turn) */}
            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-[8px] border border-[var(--color-line-dark)] bg-transparent px-3.5 py-2 text-left font-sans text-[0.85rem] text-[#cbcfd6] transition-colors hover:border-[rgba(216,189,132,0.4)] hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Inline lead form */}
            {showLead && leadState !== "done" && (
              <form onSubmit={submitLead} className="space-y-2 rounded-[10px] border border-[rgba(216,189,132,0.35)] bg-[var(--color-graphite-3)] p-3.5">
                <div>
                  <div className="font-sans text-[0.8rem] font-semibold text-[var(--color-gold-3)]">Get new matching homes first</div>
                  <div className="mt-0.5 font-sans text-[0.68rem] text-[#9aa0aa]">Tell us where to send them — no spam, unsubscribe anytime.</div>
                </div>
                <input
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  placeholder="Name"
                  className="w-full rounded-[6px] border border-[var(--color-line-dark)] bg-[var(--color-graphite-2)] px-3 py-2 font-sans text-[0.85rem] text-white placeholder:text-[#7f8792] focus:border-[var(--color-gold-3)] focus:outline-none"
                />
                <input
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  placeholder="Email"
                  type="email"
                  className="w-full rounded-[6px] border border-[var(--color-line-dark)] bg-[var(--color-graphite-2)] px-3 py-2 font-sans text-[0.85rem] text-white placeholder:text-[#7f8792] focus:border-[var(--color-gold-3)] focus:outline-none"
                />
                <input
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  placeholder="Phone"
                  type="tel"
                  className="w-full rounded-[6px] border border-[var(--color-line-dark)] bg-[var(--color-graphite-2)] px-3 py-2 font-sans text-[0.85rem] text-white placeholder:text-[#7f8792] focus:border-[var(--color-gold-3)] focus:outline-none"
                />
                {leadState === "error" && (
                  <div className="font-sans text-[0.76rem] text-[#e6a5a5]">Please add an email or phone so we can reach you.</div>
                )}
                <button type="submit" disabled={leadState === "sending"} className="btn w-full !py-2.5 !text-[0.72rem]">
                  {leadState === "sending" ? "Sending…" : "Send me matching homes"}
                </button>
              </form>
            )}
          </div>

          {/* Footer / input */}
          <div className="border-t border-[var(--color-line-dark)] bg-[var(--color-graphite-3)] px-3 py-3">
            {!showLead && leadState !== "done" && (
              <button
                onClick={() => openLead(lastUser)}
                className="mb-2 w-full rounded-[6px] border border-[rgba(216,189,132,0.35)] py-2 font-sans text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-gold-3)] hover:bg-[rgba(216,189,132,0.08)]"
              >
                Connect me with the team
              </button>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. 4-bed in Summerlin under $2M"
                className="flex-1 rounded-[8px] border border-[var(--color-line-dark)] bg-[var(--color-graphite-2)] px-3.5 py-2.5 font-sans text-[0.88rem] text-white placeholder:text-[#7f8792] focus:border-[var(--color-gold-3)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-gold)] text-white transition-colors hover:bg-[#86692f] disabled:opacity-40"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
            <div className="mt-2 text-center font-sans text-[0.64rem] text-[#7f8792]">
              Live MLS data · AI can make mistakes — confirm details with the team at {site.phone}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
