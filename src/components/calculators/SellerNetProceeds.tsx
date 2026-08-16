"use client";

import { useState } from "react";

/**
 * Seller Net Proceeds — estimates take-home cash from a sale after commission,
 * closing costs, mortgage payoff, and any concessions. A precise figure comes
 * from the team's CMA + a title net sheet; this is an educational estimate.
 */

const money = (n: number) =>
  Math.round(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const clampNum = (v: string, min = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min ? n : min;
};

export function SellerNetProceeds() {
  const [price, setPrice] = useState(600_000);
  const [payoff, setPayoff] = useState(300_000);
  const [commissionPct, setCommissionPct] = useState(5);
  const [closingPct, setClosingPct] = useState(1.5);
  const [concessions, setConcessions] = useState(0);

  const commission = price * (commissionPct / 100);
  const closing = price * (closingPct / 100);
  const net = Math.max(0, price - commission - closing - payoff - concessions);

  const field =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
  const lbl = "font-sans text-[0.68rem] uppercase tracking-[0.08em] text-[var(--color-muted)]";

  const rows: [string, number][] = [
    ["Sale price", price],
    [`Agent commission (${commissionPct}%)`, -commission],
    [`Closing costs (${closingPct}%)`, -closing],
    ["Mortgage payoff", -payoff],
    ["Concessions & repairs", -concessions],
  ];

  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft)]">
      <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
        <div className="p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={lbl}>Estimated sale price</span>
              <input type="number" min={0} step={10000} value={price} onChange={(e) => setPrice(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Estimated sale price" />
            </label>
            <label className="block">
              <span className={lbl}>Mortgage balance to pay off</span>
              <input type="number" min={0} step={10000} value={payoff} onChange={(e) => setPayoff(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Mortgage payoff" />
            </label>
            <label className="block">
              <span className={lbl}>Total commission</span>
              <div className="mt-1 flex items-center gap-1">
                <input type="number" min={0} max={10} step={0.25} value={commissionPct} onChange={(e) => setCommissionPct(clampNum(e.target.value))} className={field} aria-label="Commission percent" />
                <span className="text-[var(--color-muted)]">%</span>
              </div>
            </label>
            <label className="block">
              <span className={lbl}>Closing costs</span>
              <div className="mt-1 flex items-center gap-1">
                <input type="number" min={0} max={5} step={0.25} value={closingPct} onChange={(e) => setClosingPct(clampNum(e.target.value))} className={field} aria-label="Closing costs percent" />
                <span className="text-[var(--color-muted)]">%</span>
              </div>
            </label>
            <label className="block sm:col-span-2">
              <span className={lbl}>Concessions &amp; repairs (optional)</span>
              <input type="number" min={0} step={1000} value={concessions} onChange={(e) => setConcessions(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Concessions and repairs" />
            </label>
          </div>
          <p className="mt-5 font-sans text-[0.66rem] leading-relaxed text-[var(--color-muted)]">
            Estimate only. Closing costs (title, escrow, transfer, prorations) vary; commission is negotiable and
            set in your listing agreement. A precise net sheet comes with the team&apos;s market analysis.
          </p>
        </div>

        <div className="border-t border-[var(--color-line)] bg-[var(--color-sand)] p-6 md:border-l md:border-t-0 md:p-8">
          <div className="font-sans text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Estimated net proceeds
          </div>
          <div className="mt-1 font-serif text-[2.8rem] leading-none text-[var(--color-gold)]">
            {money(net)}
          </div>
          <dl className="mt-5 space-y-2 font-sans text-[0.88rem]">
            {rows.map(([label, val]) => (
              <div key={label} className="flex justify-between border-b border-[var(--color-line)] pb-1.5">
                <dt className="text-[var(--color-ink-soft)]">{label}</dt>
                <dd className={val < 0 ? "text-[#b4433a]" : "font-semibold text-[var(--color-ink)]"}>
                  {val < 0 ? `−${money(-val)}` : money(val)}
                </dd>
              </div>
            ))}
            <div className="flex justify-between pt-1">
              <dt className="font-semibold text-[var(--color-ink)]">Net to you</dt>
              <dd className="font-semibold text-[var(--color-gold)]">{money(net)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
