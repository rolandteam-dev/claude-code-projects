"use client";

import { useState } from "react";

/** Clamp a number into [min,max], falling back to min on NaN. */
function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}
function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/**
 * Simple, transparent monthly-payment estimator. Principal & interest, plus
 * taxes/HOA when known. Not a loan offer — clearly disclaimed.
 */
export function PaymentEstimator({
  price,
  hoaMonthly = 0,
  annualTax = 0,
}: {
  price: number;
  hoaMonthly?: number;
  annualTax?: number;
}) {
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [term, setTerm] = useState(30);

  const loan = Math.max(0, price * (1 - downPct / 100));
  const mr = rate / 100 / 12;
  const n = term * 12;
  const pi = mr > 0 ? (loan * mr) / (1 - Math.pow(1 + mr, -n)) : loan / n;
  const monthly = Math.round(pi + annualTax / 12 + hoaMonthly);

  const input =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 font-sans text-[0.9rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
  const lbl = "font-sans text-[0.68rem] uppercase tracking-[0.08em] text-[var(--color-muted)]";

  const extras = [annualTax ? "taxes" : "", hoaMonthly ? "HOA" : ""].filter(Boolean).join(" + ");

  return (
    <div className="rounded-[14px] border border-[var(--color-line)] bg-white p-5">
      <div className="font-sans text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
        Estimated monthly payment
      </div>
      <div className="mt-1 font-serif text-[2rem] leading-none text-[var(--color-gold)]">
        {money(monthly)}
        <span className="ml-1 font-sans text-[0.8rem] text-[var(--color-muted)]">/mo</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className={lbl}>Down payment</span>
          <div className="mt-1 flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={downPct}
              onChange={(e) => setDownPct(clamp(Number(e.target.value), 0, 100))}
              className={input}
              aria-label="Down payment percent"
            />
            <span className="text-[var(--color-muted)]">%</span>
          </div>
        </label>
        <label className="block">
          <span className={lbl}>Interest rate</span>
          <div className="mt-1 flex items-center gap-1">
            <input
              type="number"
              step={0.1}
              min={0}
              max={15}
              value={rate}
              onChange={(e) => setRate(clamp(Number(e.target.value), 0, 15))}
              className={input}
              aria-label="Interest rate percent"
            />
            <span className="text-[var(--color-muted)]">%</span>
          </div>
        </label>
      </div>

      <label className="mt-3 block">
        <span className={lbl}>Loan term</span>
        <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className={`${input} mt-1`} aria-label="Loan term">
          <option value={30}>30 years</option>
          <option value={15}>15 years</option>
        </select>
      </label>

      <p className="mt-3 font-sans text-[0.66rem] leading-relaxed text-[var(--color-muted)]">
        Estimate only — principal &amp; interest{extras ? ` + ${extras}` : ""}. Not a loan offer; confirm rates and
        terms with your lender.
      </p>
    </div>
  );
}
