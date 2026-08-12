"use client";

import { useState } from "react";
import Image from "next/image";
import { site } from "@/lib/site";

/**
 * Agent-forward contact card for a listing. Features Mike / The Roland Team
 * (NOT the source listing agent, which stays only in the small IDX attribution
 * line for compliance) above a contact form with three intents — Email Agent,
 * Request a Tour, Make an Offer — each routed to Follow Up Boss via /api/lead
 * with its own tag.
 */
type Intent = "email" | "tour" | "offer";

export function ScheduleTour({ address, mlsNumber }: { address: string; mlsNumber?: string }) {
  const street = address.split(",")[0];
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    message: `I'm interested in ${street}.`,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [active, setActive] = useState<Intent | null>(null);

  const initials = site.founder
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const stats = site.stats.slice(0, 3);

  async function submit(intent: Intent) {
    if (!f.email && !f.phone) {
      setStatus("error");
      return;
    }
    setActive(intent);
    setStatus("sending");
    const cfg: Record<Intent, { type: string; tags: string[]; note?: string }> = {
      email: { type: "Property Inquiry", tags: ["Luxury Buyer", "Email Agent"] },
      tour: { type: "Showing Request", tags: ["Luxury Buyer", "Showing Request"] },
      offer: { type: "Property Inquiry", tags: ["Luxury Buyer", "Make an Offer"], note: "Interested in making an offer." },
    };
    const c = cfg[intent];
    const message = [
      f.message,
      intent === "tour" && f.date ? `Preferred tour date: ${f.date}` : "",
      mlsNumber ? `MLS #${mlsNumber}` : "",
      c.note ?? "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name,
          email: f.email,
          phone: f.phone,
          address,
          message,
          type: c.type,
          tags: c.tags,
          source: "Luxury Listing Page",
        }),
      });
      const j = await res.json().catch(() => ({ ok: false }));
      setStatus(res.ok && j.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-sans text-[0.9rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
  const actionBase =
    "w-full rounded-md py-3 font-sans text-[0.92rem] font-semibold transition disabled:opacity-60";
  const busy = status === "sending";

  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-white">
      {/* Agent header — portrait when a headshot is set, monogram otherwise */}
      {site.founderPhoto ? (
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-graphite)]">
          <Image src={site.founderPhoto} alt={site.founder} fill sizes="360px" className="object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="font-sans text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-gold-2)]">
              Your Team Representative
            </div>
            <div className="mt-1 font-serif text-[1.7rem] font-semibold leading-tight text-white">{site.founder}</div>
            <div className="font-sans text-[0.84rem] text-white/85">{site.founderTitle}</div>
            <div className="font-sans text-[0.72rem] text-white/65">
              {site.name} · brokered by {site.brokerage}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 pb-0">
          <div className="font-sans text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Your Team Representative
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-graphite)] font-serif text-[1.5rem] font-medium text-[var(--color-gold-2)]">
              {initials}
            </div>
            <div>
              <div className="font-serif text-[1.25rem] font-semibold leading-tight text-[var(--color-ink)]">
                {site.founder}
              </div>
              <div className="font-sans text-[0.8rem] text-[var(--color-ink-soft)]">{site.founderTitle}</div>
              <div className="font-sans text-[0.74rem] text-[var(--color-muted)]">
                {site.name} · brokered by {site.brokerage}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 border-b border-[var(--color-line)] p-5 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-serif text-[1.05rem] font-semibold text-[var(--color-ink)]">{s.value}</div>
            <div className="font-sans text-[0.6rem] leading-tight text-[var(--color-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="p-5">
        {status === "ok" ? (
          <div className="text-center">
            <div className="font-serif text-[1.3rem] text-[var(--color-ink)]">Message sent</div>
            <p className="mt-2 font-sans text-[0.88rem] text-[var(--color-ink-soft)]">
              Thank you{f.name ? `, ${f.name.split(" ")[0]}` : ""}. {site.founder}&apos;s team will reach out about{" "}
              {street} right away.
            </p>
            <a href={`tel:${site.phone}`} className="mt-4 block font-sans text-[0.9rem] font-semibold text-[var(--color-gold)] no-underline">
              Prefer to talk now? {site.phone}
            </a>
          </div>
        ) : (
          <>
            <div className="font-serif text-[1.2rem] text-[var(--color-ink)]">More about {street}</div>
            <div className="mt-3 space-y-2.5">
              <input className={field} placeholder="Full name" aria-label="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input className={field} type="email" placeholder="Email" aria-label="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              <input className={field} type="tel" placeholder="Phone" aria-label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <textarea
                className={field}
                rows={2}
                aria-label="How can an agent help?"
                value={f.message}
                onChange={(e) => setF({ ...f, message: e.target.value })}
              />
              <label className="block">
                <span className="font-sans text-[0.66rem] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Preferred tour date (optional)
                </span>
                <input className={`${field} mt-1`} type="date" aria-label="Preferred tour date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
              </label>
              {status === "error" && (
                <div className="font-sans text-[0.78rem] text-[#b4433a]">Please add an email or phone so we can reach you.</div>
              )}

              {/* Three intents — brand colors per the request */}
              <button
                type="button"
                onClick={() => submit("email")}
                disabled={busy}
                className={`${actionBase} bg-[var(--color-gold)] text-white hover:brightness-110`}
              >
                {busy && active === "email" ? "Sending…" : "Email Agent"}
              </button>
              <button
                type="button"
                onClick={() => submit("tour")}
                disabled={busy}
                className={`${actionBase} bg-[var(--color-graphite)] text-white hover:bg-black`}
              >
                {busy && active === "tour" ? "Sending…" : "Request a Tour"}
              </button>
              <button
                type="button"
                onClick={() => submit("offer")}
                disabled={busy}
                className={`${actionBase} border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-gold)]`}
              >
                {busy && active === "offer" ? "Sending…" : "Make an Offer"}
              </button>
              <p className="text-center font-sans text-[0.66rem] text-[var(--color-muted)]">
                Or call {site.phone} — we respond fast.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
