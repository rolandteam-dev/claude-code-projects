"use client";

import { useState } from "react";
import Image from "next/image";
import { site } from "@/lib/site";

/**
 * Agent-forward contact rail for listing detail pages. Features Mike / The
 * Roland Team (NOT the source listing agent, which stays only in the small
 * IDX attribution line for compliance), with a "Schedule a Tour" request that
 * routes to Follow Up Boss via /api/lead.
 */
export function ScheduleTour({ address, mlsNumber }: { address: string; mlsNumber?: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", time: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const initials = site.founder
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const stats = site.stats.slice(0, 3);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email && !form.phone) {
      setState("error");
      return;
    }
    setState("sending");
    const when = [form.date, form.time].filter(Boolean).join(" ");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address,
          message: `Tour request for ${address}${mlsNumber ? ` (MLS #${mlsNumber})` : ""}.${
            when ? ` Preferred time: ${when}.` : ""
          }${form.message ? ` ${form.message}` : ""}`,
          type: "Showing Request",
          tag: "Schedule a Tour",
          source: "Listing Page",
        }),
      });
      const data = await res.json();
      setState(data.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  const inputCls =
    "w-full rounded-[6px] border border-[var(--color-line)] bg-white px-3 py-2 font-sans text-[0.85rem] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-gold)] focus:outline-none";

  return (
    <aside className="h-fit overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-[var(--color-sand)]">
      {/* Agent card */}
      <div className="border-b border-[var(--color-line)] p-6">
        <div className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Your Team Representative
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-graphite)] font-serif text-[1.5rem] font-medium text-[var(--color-gold-2)]">
            {site.founderPhoto ? (
              <Image src={site.founderPhoto} alt={site.founder} fill sizes="64px" className="object-cover" />
            ) : (
              initials
            )}
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

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--color-line)] pt-4 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-serif text-[1.05rem] font-semibold text-[var(--color-ink)]">{s.value}</div>
              <div className="font-sans text-[0.6rem] leading-tight text-[var(--color-muted)]">{s.label}</div>
            </div>
          ))}
        </div>

        <a
          href={`tel:${site.phone}`}
          className="mt-4 block rounded-[8px] border border-[var(--color-line)] bg-white py-2.5 text-center font-sans text-[0.9rem] font-semibold text-[var(--color-gold)] no-underline hover:border-[var(--color-gold)]"
        >
          {site.phone}
        </a>
      </div>

      {/* Schedule a tour */}
      <div className="p-6">
        {state === "done" ? (
          <div className="text-center">
            <div className="font-serif text-[1.2rem] font-semibold text-[var(--color-ink)]">Tour requested</div>
            <p className="mt-2 font-sans text-[0.86rem] text-[var(--color-ink-soft)]">
              Thank you{form.name ? `, ${form.name.split(" ")[0]}` : ""}. {site.founder}&apos;s team will reach out to
              confirm your showing of this home.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-2.5">
            <div className="font-serif text-[1.2rem] font-semibold text-[var(--color-ink)]">Schedule a Tour</div>
            <p className="-mt-1 font-sans text-[0.8rem] text-[var(--color-ink-soft)]">
              See this home in person — pick a time and {site.founder.split(" ")[0]}&apos;s team will confirm.
            </p>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              className={inputCls}
            />
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              type="email"
              className={inputCls}
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
              type="tel"
              className={inputCls}
            />
            <div className="flex gap-2">
              <input
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                type="date"
                aria-label="Preferred date"
                className={inputCls}
              />
              <select
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                aria-label="Preferred time"
                className={inputCls}
              >
                <option value="">Any time</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
            {state === "error" && (
              <div className="font-sans text-[0.76rem] text-[#b4433a]">Please add an email or phone so we can confirm.</div>
            )}
            <button type="submit" disabled={state === "sending"} className="btn w-full">
              {state === "sending" ? "Sending…" : "Request Tour"}
            </button>
            <p className="text-center font-sans text-[0.68rem] text-[var(--color-muted)]">
              Or call {site.phone} to book instantly.
            </p>
          </form>
        )}
      </div>
    </aside>
  );
}
