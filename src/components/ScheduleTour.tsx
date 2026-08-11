"use client";

import { useState } from "react";
import { site } from "@/lib/site";

/**
 * Schedule-a-tour form for a specific property. Sends the lead to Follow Up
 * Boss via /api/lead, tagged "Luxury Buyer" + "Showing Request", with the
 * property address in the structured address field so the team has context.
 */
export function ScheduleTour({ address }: { address: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [f, setF] = useState({ name: "", email: "", phone: "", date: "", message: "" });

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
          message: [`Showing request for ${address}`, f.date ? `Preferred date: ${f.date}` : "", f.message]
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

  if (status === "ok") {
    return (
      <div className="rounded-[14px] border border-[var(--color-line)] bg-white p-6 text-center">
        <div className="font-serif text-[1.3rem] text-[var(--color-ink)]">Request received</div>
        <p className="mt-2 font-sans text-[0.88rem] text-[var(--color-ink-soft)]">
          Thank you — Roland Luxury will reach out to arrange your private showing. Prefer to talk now? Call{" "}
          <a href={`tel:${site.phone}`} className="font-semibold text-[var(--color-gold)] no-underline">
            {site.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[14px] border border-[var(--color-line)] bg-white p-5">
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
          <div className="font-sans text-[0.78rem] text-red-700">Please add an email or phone so we can reach you.</div>
        )}
        <button type="submit" disabled={status === "sending"} className="btn w-full disabled:opacity-60">
          {status === "sending" ? "Sending…" : "Request Private Tour"}
        </button>
      </div>
    </form>
  );
}
