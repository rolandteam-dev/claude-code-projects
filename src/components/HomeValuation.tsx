"use client";

import { useState } from "react";
import { site } from "@/lib/site";

type Estimate = { value: number; low?: number; high?: number; confidence?: string };

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/**
 * "What's My Home Worth?" widget. Collects the homeowner's property + contact,
 * requests an instant AVM estimate, and captures the seller lead in Follow Up
 * Boss (server-side). Every submission is a lead, whether or not the instant
 * number is available.
 */
export function HomeValuation() {
  const [f, setF] = useState({
    address: "",
    city: "",
    zip: "",
    propertyType: "Single Family",
    beds: "",
    baths: "",
    sqft: "",
    yearBuilt: "",
    name: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.email && !f.phone) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: f.address,
          city: f.city,
          zip: f.zip,
          propertyType: f.propertyType,
          beds: Number(f.beds) || undefined,
          baths: Number(f.baths) || undefined,
          sqft: Number(f.sqft) || undefined,
          yearBuilt: Number(f.yearBuilt) || undefined,
          name: f.name,
          email: f.email,
          phone: f.phone,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setEstimate(data.estimate ?? null);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-sans text-[0.9rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";

  if (status === "done") {
    return (
      <div className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
        {estimate ? (
          <>
            <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Estimated value
            </div>
            <div className="mt-1 font-serif text-[3rem] leading-none text-[var(--color-gold)]">
              {fmt(estimate.value)}
            </div>
            {estimate.low && estimate.high && (
              <div className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
                Likely range {fmt(estimate.low)} – {fmt(estimate.high)}
                {estimate.confidence ? ` · ${estimate.confidence} confidence` : ""}
              </div>
            )}
            <p className="mt-4 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
              This is an automated estimate. {site.founder.split(" ")[0]}&apos;s team will follow up with a precise,
              human CMA based on your home&apos;s condition, upgrades, and current demand.
            </p>
          </>
        ) : (
          <>
            <div className="font-serif text-[1.5rem] text-[var(--color-ink)]">Request received</div>
            <p className="mt-2 font-sans text-[0.92rem] text-[var(--color-ink-soft)]">
              Thank you{f.name ? `, ${f.name.split(" ")[0]}` : ""}. {site.founder}&apos;s team will prepare your home
              valuation and reach out shortly with a precise, local market analysis.
            </p>
          </>
        )}
        <a href={`tel:${site.phone}`} className="mt-5 block text-center font-sans text-[0.85rem] font-semibold text-[var(--color-gold)] no-underline">
          Prefer to talk now? {site.phone}
        </a>
        <p className="mt-3 font-sans text-[0.66rem] leading-relaxed text-[var(--color-muted)]">
          Automated estimates are not an appraisal or a guarantee of value. For a precise figure, rely on the team&apos;s CMA.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
      <div className="font-sans text-[1.1rem] font-semibold">What&apos;s my home worth?</div>
      <p className="mt-1 font-sans text-[0.82rem] text-[var(--color-ink-soft)]">
        Get an instant estimate — then a precise valuation from the team.
      </p>
      <div className="mt-4 space-y-2.5">
        <input className={field} placeholder="Street address" value={f.address} onChange={(e) => set("address", e.target.value)} />
        <div className="flex gap-2.5">
          <input className={field} placeholder="City" value={f.city} onChange={(e) => set("city", e.target.value)} />
          <input className={field} placeholder="ZIP" value={f.zip} onChange={(e) => set("zip", e.target.value)} />
        </div>
        <div className="flex gap-2.5">
          <select className={field} value={f.propertyType} onChange={(e) => set("propertyType", e.target.value)} aria-label="Property type">
            <option>Single Family</option>
            <option>Condo</option>
            <option>Townhouse</option>
            <option>Multi-Family</option>
          </select>
          <input className={field} type="number" min="0" placeholder="Sq ft" value={f.sqft} onChange={(e) => set("sqft", e.target.value)} aria-label="Square feet" />
        </div>
        <div className="flex gap-2.5">
          <input className={field} type="number" min="0" placeholder="Beds" value={f.beds} onChange={(e) => set("beds", e.target.value)} aria-label="Bedrooms" />
          <input className={field} type="number" min="0" placeholder="Baths" value={f.baths} onChange={(e) => set("baths", e.target.value)} aria-label="Bathrooms" />
          <input className={field} type="number" min="0" placeholder="Year built" value={f.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} aria-label="Year built" />
        </div>
        <div className="border-t border-[var(--color-line)] pt-2.5">
          <input className={field} placeholder="Your name" value={f.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <input className={field} type="email" placeholder="Email" value={f.email} onChange={(e) => set("email", e.target.value)} />
        <input className={field} type="tel" placeholder="Phone" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        {status === "error" && (
          <div className="font-sans text-[0.78rem] text-[#b4433a]">Please add an email or phone so we can send your valuation.</div>
        )}
        <button type="submit" disabled={status === "sending"} className="btn w-full disabled:opacity-60">
          {status === "sending" ? "Calculating…" : "Get My Home Value"}
        </button>
        <p className="text-center font-sans text-[0.66rem] text-[var(--color-muted)]">
          No obligation. Your info goes only to {site.parentBrand}.
        </p>
      </div>
    </form>
  );
}
