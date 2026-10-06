"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Shown on a homeowner dashboard when we couldn't resolve the home from the MLS.
 * Collects beds / baths / sqft / property type from the owner and runs the SAME
 * comp estimate on those real values — we never invent a number. On success the
 * page refreshes into the full value dashboard.
 */
const field =
  "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
const label = "mb-1 block font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]";

export function HomeDetailsForm({ token }: { token: string }) {
  const router = useRouter();
  const [f, setF] = useState({ beds: "", baths: "", sqft: "", propertyType: "Single Family" });
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "nocomps">("idle");
  const [msg, setMsg] = useState("");

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.beds || !f.sqft.trim()) {
      setStatus("error");
      setMsg("Please add bedrooms and square footage.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/homeowners/estimate-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          beds: Number(f.beds),
          baths: Number(f.baths) || undefined,
          sqft: Number(f.sqft),
          propertyType: f.propertyType,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        router.refresh(); // re-render into the full value dashboard
      } else if (data.reason === "insufficient_comps") {
        setStatus("nocomps");
      } else {
        setStatus("error");
        setMsg("We couldn't generate an instant estimate — our team will prepare one by hand.");
      }
    } catch {
      setStatus("error");
      setMsg("Something went wrong — please try again, or reach out and we'll run it by hand.");
    }
  }

  if (status === "nocomps") {
    return (
      <p className="mt-5 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        Thanks — there aren&apos;t enough recent sold comparables that match your home for a defensible
        instant number, which is common for unique or luxury properties. Our team will prepare a precise
        valuation by hand.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-6 max-w-[420px] text-left">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Bedrooms *</label>
          <select className={field} value={f.beds} onChange={(e) => set("beds", e.target.value)} required>
            <option value="">Select</option>
            {["1", "2", "3", "4", "5", "6"].map((b) => (
              <option key={b} value={b}>
                {b === "6" ? "6+" : b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Bathrooms</label>
          <select className={field} value={f.baths} onChange={(e) => set("baths", e.target.value)}>
            <option value="">Select</option>
            {["1", "2", "3", "4", "5"].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
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
        <div>
          <label className={label}>Property type</label>
          <select className={field} value={f.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
            <option>Single Family</option>
            <option>Condo</option>
            <option>Townhouse</option>
            <option>Multi-Family</option>
          </select>
        </div>
      </div>
      {status === "error" && <div className="mt-2 font-sans text-[0.78rem] text-[#b4433a]">{msg}</div>}
      <button type="submit" disabled={status === "sending"} className="btn mt-4 w-full disabled:opacity-60">
        {status === "sending" ? "Calculating…" : "See my estimate →"}
      </button>
      <p className="mt-2 text-center font-sans text-[0.62rem] text-[var(--color-muted)]">
        Instant range from recent sold comps. Not an appraisal.
      </p>
    </form>
  );
}
