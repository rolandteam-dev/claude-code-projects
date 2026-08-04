"use client";

import { useState } from "react";
import { site } from "@/lib/site";

const field =
  "w-full rounded-md border border-[var(--color-line)] bg-white px-4 py-3 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";

export function LeadForm({
  type = "General Inquiry",
  tag,
  source,
  showAddress = false,
  submitLabel = "Send",
}: {
  type?: string;
  tag?: string;
  source?: string;
  showAddress?: boolean;
  submitLabel?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, type, tag, source }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      setStatus(res.ok && json.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-sand)] p-6 text-center">
        <div className="font-sans text-[1.1rem] font-semibold text-[var(--color-ink)]">Thank you!</div>
        <p className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
          Your message is on its way to The Roland Team. We&apos;ll be in touch shortly. Prefer to talk now? Call{" "}
          <a href={`tel:${site.phone}`} className="font-semibold text-[var(--color-gold)] no-underline">{site.phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {showAddress && (
        <input className={field} name="address" placeholder="Property address" aria-label="Property address" required />
      )}
      <div className="grid grid-cols-2 gap-4">
        <input className={field} name="firstName" placeholder="First name" aria-label="First name" required />
        <input className={field} name="lastName" placeholder="Last name" aria-label="Last name" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input className={field} name="email" type="email" placeholder="Email" aria-label="Email" required />
        <input className={field} name="phone" type="tel" placeholder="Phone" aria-label="Phone" />
      </div>
      <textarea className={field} name="message" rows={3} placeholder="How can we help? (optional)" aria-label="Message" />
      <button type="submit" disabled={status === "sending"} className="btn w-full disabled:opacity-60">
        {status === "sending" ? "Sending…" : submitLabel}
      </button>
      {status === "error" && (
        <p className="font-sans text-[0.8rem] text-red-700">
          Something went wrong. Please call {site.phone} or email{" "}
          <a href={`mailto:${site.email}`} className="underline">{site.email}</a>.
        </p>
      )}
    </form>
  );
}
