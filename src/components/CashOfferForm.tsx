"use client";

/**
 * Cash Offer request form. Posts to /api/homeowners/cash-offer (FUB lead +
 * homeowner tracking + acknowledgement email). No instant number is promised —
 * the team follows up with real cash-offer options plus an open-market
 * comparison, which is the honest framing.
 */
import { useState } from "react";
import { site } from "@/lib/site";

const field =
  "w-full rounded-md border border-[var(--color-line)] bg-white px-4 py-3 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";

export function CashOfferForm() {
  const [f, setF] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    timeframe: "As soon as possible",
    condition: "Good",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.address.trim() || (!f.email.trim() && !f.phone.trim())) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/homeowners/cash-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      setStatus(res.ok && json.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-[14px] bg-white p-8 text-center text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
        <div className="font-serif text-[1.6rem]">Request received ✦</div>
        <p className="mx-auto mt-2 max-w-[420px] font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          {site.founder.split(" ")[0]}&apos;s team will review your home and reach out with your cash-offer options —
          plus what the same home could bring on the open market, so you can compare. No obligation.
        </p>
        <a href={`tel:${site.phone}`} className="mt-5 inline-block font-sans text-[0.9rem] font-semibold text-[var(--color-gold)] no-underline">
          Prefer to talk now? {site.phone}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
      <div className="font-sans text-[1.1rem] font-semibold">Request your cash offer</div>
      <p className="mt-1 font-sans text-[0.82rem] text-[var(--color-ink-soft)]">
        Tell us about your home — we&apos;ll follow up with your options. No obligation.
      </p>
      <div className="mt-4 space-y-3">
        <input className={field} placeholder="Property address" value={f.address} onChange={(e) => set("address", e.target.value)} aria-label="Property address" required />
        <div className="grid grid-cols-2 gap-3">
          <input className={field} placeholder="City" value={f.city} onChange={(e) => set("city", e.target.value)} aria-label="City" />
          <input className={field} placeholder="ZIP" value={f.zip} onChange={(e) => set("zip", e.target.value.replace(/[^0-9]/g, "").slice(0, 5))} aria-label="ZIP" inputMode="numeric" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">Timeframe</span>
            <select className={field} value={f.timeframe} onChange={(e) => set("timeframe", e.target.value)} aria-label="Timeframe">
              <option>As soon as possible</option>
              <option>1–3 months</option>
              <option>3–6 months</option>
              <option>Just exploring</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">Condition</span>
            <select className={field} value={f.condition} onChange={(e) => set("condition", e.target.value)} aria-label="Condition">
              <option>Excellent</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Needs work</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={field} placeholder="First name" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} aria-label="First name" />
          <input className={field} placeholder="Last name" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} aria-label="Last name" />
        </div>
        <input className={field} type="email" placeholder="Email" value={f.email} onChange={(e) => set("email", e.target.value)} aria-label="Email" />
        <input className={field} type="tel" placeholder="Phone" value={f.phone} onChange={(e) => set("phone", e.target.value)} aria-label="Phone" />
        {status === "error" && (
          <div className="font-sans text-[0.78rem] text-[#b4433a]">Please add your address and an email or phone.</div>
        )}
        <button type="submit" disabled={status === "sending"} className="btn w-full disabled:opacity-60">
          {status === "sending" ? "Sending…" : "Get My Cash Offer"}
        </button>
        <p className="text-center font-sans text-[0.64rem] text-[var(--color-muted)]">
          Your info goes only to {site.name}. No obligation to accept.
        </p>
      </div>
    </form>
  );
}
