"use client";

import { useState } from "react";
import Image from "next/image";
import { site } from "@/lib/site";

/**
 * Agent-forward "Schedule a private tour" card for a listing. Features Mike /
 * The Roland Team (headshot or monogram + team stats) — NOT the source listing
 * agent, which stays only in the small IDX attribution line for compliance —
 * above a tour-request form that routes to Follow Up Boss via /api/lead,
 * tagged "Luxury Buyer" + "Showing Request" with the property address.
 */
export function ScheduleTour({ address, mlsNumber }: { address: string; mlsNumber?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [f, setF] = useState({ name: "", email: "", phone: "", date: "", message: "" });

  const initials = site.founder
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const stats = site.stats.slice(0, 3);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.email && !f.phone) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name,
          email: f.email,
          phone: f.phone,
          address,
          type: "Property Inquiry",
          tags: ["Luxury Buyer", "Showing Request"],
          source: "Luxury Listing Page",
          message: [
            `Showing request for ${address}${mlsNumber ? ` (MLS #${mlsNumber})` : ""}`,
            f.date ? `Preferred date: ${f.date}` : "",
            f.message,
          ]
            .filter(Boolean)
            .join("\n"),
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

      {/* Team stats */}
      <div className="grid grid-cols-3 gap-2 border-b border-[var(--color-line)] p-5 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-serif text-[1.05rem] font-semibold text-[var(--color-ink)]">{s.value}</div>
            <div className="font-sans text-[0.6rem] leading-tight text-[var(--color-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tour request */}
      <div className="p-5">
        {status === "ok" ? (
          <div className="text-center">
            <div className="font-serif text-[1.3rem] text-[var(--color-ink)]">Request received</div>
            <p className="mt-2 font-sans text-[0.88rem] text-[var(--color-ink-soft)]">
              Thank you — {site.founder}&apos;s team will reach out to arrange your private showing. Prefer to talk now?
              Call{" "}
              <a href={`tel:${site.phone}`} className="font-semibold text-[var(--color-gold)] no-underline">
                {site.phone}
              </a>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="font-serif text-[1.25rem] text-[var(--color-ink)]">Schedule a private tour</div>
            <p className="mt-1 font-sans text-[0.82rem] text-[var(--color-ink-soft)]">
              See this home in person, on your schedule.
            </p>
            <div className="mt-4 space-y-3">
              <input
                className={field}
                placeholder="Full name"
                aria-label="Full name"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
              <input
                className={field}
                type="email"
                placeholder="Email"
                aria-label="Email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
              <input
                className={field}
                type="tel"
                placeholder="Phone"
                aria-label="Phone"
                value={f.phone}
                onChange={(e) => setF({ ...f, phone: e.target.value })}
              />
              <label className="block">
                <span className="font-sans text-[0.68rem] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Preferred date
                </span>
                <input
                  className={`${field} mt-1`}
                  type="date"
                  aria-label="Preferred tour date"
                  value={f.date}
                  onChange={(e) => setF({ ...f, date: e.target.value })}
                />
              </label>
              <textarea
                className={field}
                rows={2}
                placeholder="Anything we should know? (optional)"
                aria-label="Message"
                value={f.message}
                onChange={(e) => setF({ ...f, message: e.target.value })}
              />
              {status === "error" && (
                <div className="font-sans text-[0.78rem] text-red-700">
                  Please add an email or phone so we can reach you.
                </div>
              )}
              <button type="submit" disabled={status === "sending"} className="btn w-full disabled:opacity-60">
                {status === "sending" ? "Sending…" : "Request Private Tour"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
