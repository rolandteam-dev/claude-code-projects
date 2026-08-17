"use client";

import { useState } from "react";
import Image from "next/image";
import { site } from "@/lib/site";
import { markConverted } from "@/lib/concierge/behavior";
import { rememberIdentity } from "@/lib/concierge/identity";

/**
 * Agent-forward contact card for a listing. The three intents — Email Agent,
 * Request a Tour, Make an Offer — lead the card as bold, high-contrast CTAs so
 * they're the first thing a buyer notices. Mike / The Roland Team appears as a
 * compact trust bar BELOW the actions (never the source listing agent, which
 * stays only in the small IDX attribution line for compliance). Each intent is
 * routed to Follow Up Boss via /api/lead with its own tag.
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
  const [grant, setGrant] = useState(false);
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
    const tags = [...c.tags];
    if (grant) tags.push("Down Payment Assistance");
    const message = [
      f.message,
      intent === "tour" && f.date ? `Preferred tour date: ${f.date}` : "",
      grant ? "Requested info on down payment assistance / grant programs." : "",
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
          tags,
          source: "Luxury Listing Page",
        }),
      });
      const j = await res.json().catch(() => ({ ok: false }));
      const ok = res.ok && j.ok;
      if (ok) {
        rememberIdentity({ name: f.name, email: f.email, phone: f.phone });
        markConverted();
      }
      setStatus(ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-sans text-[0.9rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
  // Bold, high-contrast CTAs — larger tap target + shadow so they anchor the card.
  const actionBase =
    "flex w-full items-center justify-center gap-2 rounded-md py-3.5 font-sans text-[0.98rem] font-semibold shadow-[0_6px_16px_rgba(20,22,27,0.12)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60";
  const busy = status === "sending";

  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft)]">
      {/* Contact + intents lead the card */}
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
            <div className="font-serif text-[1.35rem] leading-tight text-[var(--color-ink)]">More about {street}</div>
            <p className="mt-1 font-sans text-[0.82rem] text-[var(--color-ink-soft)]">
              Choose how you&apos;d like to connect — we respond fast.
            </p>
            <div className="mt-4 space-y-2.5">
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

              {/* Down payment grant / assistance toggle */}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-[var(--color-line)] bg-[var(--color-sand)] p-3">
                <input
                  type="checkbox"
                  checked={grant}
                  onChange={(e) => setGrant(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-gold)]"
                  aria-label="Tell me about down payment assistance and grant programs"
                />
                <span className="font-sans text-[0.82rem] leading-snug text-[var(--color-ink)]">
                  Tell me about <strong>down payment assistance &amp; grant programs</strong> — I may qualify for help
                  with my down payment.
                </span>
              </label>

              {status === "error" && (
                <div className="font-sans text-[0.78rem] text-[#b4433a]">Please add an email or phone so we can reach you.</div>
              )}

              {/* Three intents — bold, distinct colors so they stand out */}
              <button
                type="button"
                onClick={() => submit("email")}
                disabled={busy}
                className={`${actionBase} bg-[var(--color-gold)] text-white hover:brightness-110`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                {busy && active === "email" ? "Sending…" : "Email Agent"}
              </button>
              <button
                type="button"
                onClick={() => submit("tour")}
                disabled={busy}
                className={`${actionBase} bg-[#1f6feb] text-white hover:brightness-110`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <path d="M3 9h18M8 2v4M16 2v4" />
                </svg>
                {busy && active === "tour" ? "Sending…" : "Request a Tour"}
              </button>
              <button
                type="button"
                onClick={() => submit("offer")}
                disabled={busy}
                className={`${actionBase} bg-[#1d7a5f] text-white hover:brightness-110`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20.6 12.6 12 21l-8-8V4h9z" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                {busy && active === "offer" ? "Sending…" : "Make an Offer"}
              </button>
              <p className="text-center font-sans text-[0.66rem] text-[var(--color-muted)]">
                Or call {site.phone} — we respond fast.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Agent trust bar — moved below the actions */}
      <div className="border-t border-[var(--color-line)] bg-[var(--color-sand)] p-5">
        <div className="flex items-center gap-3">
          {site.founderPhoto ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--color-graphite)]">
              <Image src={site.founderPhoto} alt={site.founder} fill sizes="56px" className="object-cover object-top" />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-graphite)] font-serif text-[1.25rem] font-medium text-[var(--color-gold-2)]">
              {initials}
            </div>
          )}
          <div>
            <div className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-gold)]">
              Your Team Representative
            </div>
            <div className="font-serif text-[1.2rem] font-semibold leading-tight text-[var(--color-ink)]">
              {site.founder}
            </div>
            <div className="font-sans text-[0.74rem] text-[var(--color-ink-soft)]">
              {site.name} · brokered by {site.brokerage}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-serif text-[1.05rem] font-semibold text-[var(--color-ink)]">{s.value}</div>
              <div className="font-sans text-[0.6rem] leading-tight text-[var(--color-muted)]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
