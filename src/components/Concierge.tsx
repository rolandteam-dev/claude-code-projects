"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content:
    "Welcome to Roland Luxury. I'm your private concierge — ask me about our communities, the Las Vegas luxury market, or buying and selling. How may I help?",
};

const SUGGESTIONS = [
  "Tell me about guard-gated communities",
  "How's the luxury market right now?",
  "I'm thinking of selling my home",
];

export function Concierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [lead, setLead] = useState({ name: "", email: "", phone: "", message: "" });
  const [leadState, setLeadState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, showLead]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "Let me connect you with the team." }]);
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
          type: "General Inquiry",
          tag: "AI Concierge",
          source: "Luxury Website",
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
          aria-label="Open the Roland Luxury concierge"
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
                <div className="font-sans text-[0.86rem] font-semibold leading-tight">Roland Luxury Concierge</div>
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
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-[12px] rounded-br-sm bg-[var(--color-gold)] px-3.5 py-2.5 font-sans text-[0.9rem] text-white"
                    : "mr-auto max-w-[90%] rounded-[12px] rounded-bl-sm bg-[var(--color-graphite-2)] px-3.5 py-2.5 text-[0.94rem] leading-relaxed text-[#e8eaee]"
                }
              >
                {m.content}
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
                <div className="font-sans text-[0.8rem] font-semibold text-[var(--color-gold-3)]">Connect with the team</div>
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
                  {leadState === "sending" ? "Sending…" : "Request a callback"}
                </button>
              </form>
            )}
          </div>

          {/* Footer / input */}
          <div className="border-t border-[var(--color-line-dark)] bg-[var(--color-graphite-3)] px-3 py-3">
            {!showLead && leadState !== "done" && (
              <button
                onClick={() => setShowLead(true)}
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
                placeholder="Ask the concierge…"
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
              AI concierge · for current listings &amp; pricing, connect with the team
            </div>
          </div>
        </div>
      )}
    </>
  );
}
