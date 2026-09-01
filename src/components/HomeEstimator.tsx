"use client";

import { useState } from "react";
import { site } from "@/lib/site";

type Estimate = { low: number; mid: number; high: number; compCount: number; ppsfMedian: number };
type ApiResponse =
  | { ok: true; estimate: Estimate }
  | { ok: false; reason: string };

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const field =
  "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
const label = "mb-1 block font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]";

/**
 * Instant comp-based home value estimator. Posts ZIP + beds + sqft to
 * /api/home-estimate (Repliers sold comps) and shows a low/mid/high range —
 * no email required to see the number. Routes to a full human CMA afterward.
 */
export function HomeEstimator() {
  const [f, setF] = useState({
    address: "",
    zip: "",
    city: "",
    propertyType: "Single Family",
    beds: "3",
    sqft: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "nocomps" | "error">("idle");
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.zip.trim() || !f.beds || !f.sqft.trim()) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/home-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip: f.zip,
          city: f.city,
          propertyType: f.propertyType,
          beds: Number(f.beds),
          sqft: Number(f.sqft),
        }),
      });
      const data: ApiResponse = await res.json();
      if (data.ok) {
        setEstimate(data.estimate);
        setStatus("done");
      } else {
        // Any non-success reason (no comps, not configured, upstream) → the
        // same graceful "let a human run it" fallback.
        setStatus("nocomps");
      }
    } catch {
      setStatus("nocomps");
    }
  }

  if (status === "done" && estimate) {
    return (
      <div className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
        <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Estimated value range
        </div>
        <div className="mt-1 font-serif text-[2.9rem] leading-none text-[var(--color-gold)]">{fmt(estimate.mid)}</div>
        <div className="mt-2 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Likely range <strong>{fmt(estimate.low)}</strong> – <strong>{fmt(estimate.high)}</strong>
        </div>
        <div className="mt-3 rounded-md bg-[var(--color-sand)] px-3 py-2 font-sans text-[0.78rem] text-[var(--color-ink-soft)]">
          Based on <strong>{estimate.compCount}</strong> sold comps in {f.zip} over the past 6 months · median{" "}
          {fmt(estimate.ppsfMedian)}/sqft.
        </div>
        <a href="#request-cma" className="btn mt-5 w-full">
          Get my precise CMA →
        </a>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setEstimate(null);
          }}
          className="mt-3 block w-full text-center font-sans text-[0.8rem] font-semibold text-[var(--color-gold)]"
        >
          Estimate another home
        </button>
        <p className="mt-3 font-sans text-[0.64rem] leading-relaxed text-[var(--color-muted)]">
          This is a data-backed estimate from recent sold comparables, not an appraisal or a guarantee of value. Your
          home&apos;s condition, upgrades, lot, and view can move the number ±15%. For a precise figure, request a CMA.
        </p>
      </div>
    );
  }

  if (status === "nocomps") {
    return (
      <div className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
        <div className="font-serif text-[1.4rem] text-[var(--color-ink)]">Let&apos;s run this one by hand</div>
        <p className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
          There aren&apos;t enough recent sold comparables in {f.zip || "that ZIP"} that match your home to give a
          defensible instant range — which is common for unique or luxury properties. {site.founder.split(" ")[0]}&apos;s
          team will pull the full comp set and prepare a precise CMA.
        </p>
        <a href="#request-cma" className="btn mt-5 w-full">
          Request a free CMA →
        </a>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-3 block w-full text-center font-sans text-[0.8rem] font-semibold text-[var(--color-gold)]"
        >
          Try a different home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
      <div className="font-sans text-[1.1rem] font-semibold">Get a starting home value</div>
      <p className="mt-1 font-sans text-[0.82rem] text-[var(--color-ink-soft)]">
        Enter your ZIP, bedrooms, and square footage — no sign-up, no email required to see the number.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className={label}>Street address (optional)</label>
          <input className={field} placeholder="123 Main St, City, NV" value={f.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>ZIP code *</label>
            <input
              className={field}
              inputMode="numeric"
              placeholder="89135"
              value={f.zip}
              onChange={(e) => set("zip", e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
              required
            />
          </div>
          <div>
            <label className={label}>City</label>
            <input className={field} placeholder="Las Vegas" value={f.city} onChange={(e) => set("city", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label}>Property type</label>
          <select className={field} value={f.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
            <option>Single Family</option>
            <option>Condo</option>
            <option>Townhouse</option>
            <option>Multi-Family</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Bedrooms *</label>
            <select className={field} value={f.beds} onChange={(e) => set("beds", e.target.value)} required>
              {["1", "2", "3", "4", "5", "6"].map((b) => (
                <option key={b} value={b}>
                  {b === "6" ? "6+" : b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Square footage *</label>
            <input
              className={field}
              inputMode="numeric"
              placeholder="2,400"
              value={f.sqft}
              onChange={(e) => set("sqft", e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              required
            />
          </div>
        </div>
        {status === "error" && (
          <div className="font-sans text-[0.78rem] text-[#b4433a]">Please enter your ZIP, bedrooms, and square footage.</div>
        )}
        <button type="submit" disabled={status === "loading"} className="btn w-full disabled:opacity-60">
          {status === "loading" ? "Pulling comps…" : "Estimate my home value →"}
        </button>
        <p className="text-center font-sans text-[0.64rem] text-[var(--color-muted)]">
          Live Nevada MLS data · Instant range from sold comps · Not an appraisal.
        </p>
      </div>
    </form>
  );
}
