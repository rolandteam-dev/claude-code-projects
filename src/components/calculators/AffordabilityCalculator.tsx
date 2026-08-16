"use client";

import { useState } from "react";

/**
 * "How much home can I afford?" — solves for the maximum purchase price given
 * income, monthly debts, and down payment, using standard 28% front-end /
 * back-end DTI guidance. Nevada-friendly defaults (low property-tax rate).
 * Educational estimate only — not a loan pre-approval.
 */

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const clampNum = (v: string, min = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n > min ? n : min;
};

// Standard qualifying ratios.
const FRONT_END = 0.28; // housing cost ≤ 28% of gross monthly income
const BACK_END = 0.43; // total debt ≤ 43% of gross monthly income

export function AffordabilityCalculator() {
  const [income, setIncome] = useState(180_000);
  const [debts, setDebts] = useState(600);
  const [down, setDown] = useState(80_000);
  const [rate, setRate] = useState(6.5);
  const [term, setTerm] = useState(30);

  // Nevada assumptions (kept internal, disclosed below).
  const taxRate = 0.006; // ~0.6% effective annual property tax
  const insAnnual = 1_400; // homeowner's insurance
  const hoa = 0; // conservative: no HOA in the base estimate

  const grossMonthly = income / 12;
  // Housing budget is the lesser of the front-end cap and what the back-end
  // ratio leaves after existing debts.
  const housingBudget = Math.max(
    0,
    Math.min(grossMonthly * FRONT_END, grossMonthly * BACK_END - debts)
  );

  const mr = rate / 100 / 12;
  const n = term * 12;
  // Monthly payment factor per dollar of loan.
  const factor = mr > 0 ? mr / (1 - Math.pow(1 + mr, -n)) : 1 / n;

  // Solve PITI budget for price:
  // budget = (price - down)*factor + price*taxRate/12 + insAnnual/12 + hoa
  const nonPI = insAnnual / 12 + hoa;
  const maxPrice = Math.max(
    down,
    (housingBudget + down * factor - nonPI) / (factor + taxRate / 12)
  );
  const loan = Math.max(0, maxPrice - down);
  const pi = loan * factor;
  const piti = Math.round(pi + (maxPrice * taxRate) / 12 + insAnnual / 12 + hoa);
  const downPct = maxPrice > 0 ? Math.round((down / maxPrice) * 100) : 0;

  const field =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
  const lbl = "font-sans text-[0.68rem] uppercase tracking-[0.08em] text-[var(--color-muted)]";

  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft)]">
      <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
        {/* Inputs */}
        <div className="p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={lbl}>Annual household income</span>
              <input type="number" min={0} step={5000} value={income} onChange={(e) => setIncome(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Annual household income" />
            </label>
            <label className="block">
              <span className={lbl}>Monthly debt payments</span>
              <input type="number" min={0} step={50} value={debts} onChange={(e) => setDebts(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Monthly debt payments" />
            </label>
            <label className="block">
              <span className={lbl}>Down payment</span>
              <input type="number" min={0} step={5000} value={down} onChange={(e) => setDown(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Down payment" />
            </label>
            <label className="block">
              <span className={lbl}>Interest rate</span>
              <div className="mt-1 flex items-center gap-1">
                <input type="number" min={0} max={15} step={0.1} value={rate} onChange={(e) => setRate(clampNum(e.target.value))} className={field} aria-label="Interest rate percent" />
                <span className="text-[var(--color-muted)]">%</span>
              </div>
            </label>
            <label className="block">
              <span className={lbl}>Loan term</span>
              <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className={`${field} mt-1`} aria-label="Loan term">
                <option value={30}>30 years</option>
                <option value={15}>15 years</option>
              </select>
            </label>
          </div>
          <p className="mt-5 font-sans text-[0.66rem] leading-relaxed text-[var(--color-muted)]">
            Uses standard {Math.round(FRONT_END * 100)}% housing / {Math.round(BACK_END * 100)}% total-debt
            qualifying ratios, ~0.6% Nevada property tax, and {money(insAnnual)}/yr insurance. Estimate only —
            not a pre-approval or commitment to lend. Your lender&apos;s program, credit, and reserves determine
            your actual budget.
          </p>
        </div>

        {/* Result */}
        <div className="border-t border-[var(--color-line)] bg-[var(--color-sand)] p-6 md:border-l md:border-t-0 md:p-8">
          <div className="font-sans text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            You could afford about
          </div>
          <div className="mt-1 font-serif text-[2.8rem] leading-none text-[var(--color-gold)]">
            {money(maxPrice)}
          </div>
          <dl className="mt-5 space-y-2.5 font-sans text-[0.9rem]">
            <div className="flex justify-between border-b border-[var(--color-line)] pb-2">
              <dt className="text-[var(--color-ink-soft)]">Est. monthly payment</dt>
              <dd className="font-semibold text-[var(--color-ink)]">{money(piti)}/mo</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-line)] pb-2">
              <dt className="text-[var(--color-ink-soft)]">Loan amount</dt>
              <dd className="font-semibold text-[var(--color-ink)]">{money(loan)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Down payment</dt>
              <dd className="font-semibold text-[var(--color-ink)]">{money(down)} ({downPct}%)</dd>
            </div>
          </dl>
          <p className="mt-4 font-sans text-[0.72rem] leading-relaxed text-[var(--color-ink-soft)]">
            Payment includes principal, interest, estimated taxes, and insurance.
          </p>
        </div>
      </div>
    </div>
  );
}
