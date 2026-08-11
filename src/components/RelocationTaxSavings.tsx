"use client";

import { useState } from "react";

/**
 * "California → Nevada Tax Savings" — estimates the California state income
 * tax a buyer would no longer pay after moving to Nevada (which has no state
 * income tax). Marketing estimate only, not tax advice.
 */

// 2024 California marginal income-tax brackets (single filer). Married-filing-
// jointly thresholds are ~2x. Excludes deductions, credits, and the >$1M
// mental-health surcharge.
const CA_SINGLE: [number, number][] = [
  [0, 0.01],
  [10_412, 0.02],
  [24_684, 0.04],
  [38_959, 0.06],
  [54_081, 0.08],
  [68_350, 0.093],
  [349_137, 0.103],
  [418_961, 0.113],
  [698_271, 0.123],
];

function caIncomeTax(income: number, married: boolean): number {
  const mult = married ? 2 : 1;
  const brackets = CA_SINGLE.map(([t, r]) => [t * mult, r] as [number, number]);
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [lower, rate] = brackets[i];
    const upper = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (income <= lower) break;
    tax += (Math.min(income, upper) - lower) * rate;
  }
  return Math.max(0, tax);
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function RelocationTaxSavings() {
  const [income, setIncome] = useState(250_000);
  const [married, setMarried] = useState(true);

  const yearOne = Math.round(caIncomeTax(income, married));
  // 10-year cumulative assuming ~3% annual income growth (annuity factor ≈ 11.46).
  const tenYear = Math.round(yearOne * ((Math.pow(1.03, 10) - 1) / 0.03));

  const field =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";

  return (
    <section className="mt-10 overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-[var(--color-sand)]">
      <div className="p-6 md:p-8">
        <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">
          Relocation Math
        </div>
        <h2 className="mt-2 font-serif text-[1.9rem] leading-tight text-[var(--color-ink)]">
          California → Nevada Tax Savings
        </h2>
        <p className="mt-2 max-w-[560px] font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
          Nevada has no state income tax. Here&apos;s roughly what you&apos;d keep by moving from California.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-sans text-[0.68rem] uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Household income (annual)
            </span>
            <input
              type="number"
              min={0}
              step={10000}
              value={income}
              onChange={(e) => setIncome(Math.max(0, Number(e.target.value) || 0))}
              className={`${field} mt-1`}
              aria-label="Household income"
            />
          </label>
          <div className="block">
            <span className="font-sans text-[0.68rem] uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Filing status
            </span>
            <div className="mt-1 flex gap-4 py-2.5 font-sans text-[0.9rem] text-[var(--color-ink)]">
              <label className="flex items-center gap-1.5">
                <input type="radio" name="filing" checked={married} onChange={() => setMarried(true)} /> Married, jointly
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="filing" checked={!married} onChange={() => setMarried(false)} /> Single
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[12px] border border-[var(--color-line)] bg-white p-5">
            <div className="font-sans text-[0.66rem] uppercase tracking-[0.1em] text-[var(--color-muted)]">
              Year-one savings
            </div>
            <div className="mt-1 font-serif text-[2.2rem] leading-none text-[var(--color-gold)]">{fmt(yearOne)}</div>
          </div>
          <div className="rounded-[12px] border border-[var(--color-line)] bg-white p-5">
            <div className="font-sans text-[0.66rem] uppercase tracking-[0.1em] text-[var(--color-muted)]">
              10-year cumulative
            </div>
            <div className="mt-1 font-serif text-[2.2rem] leading-none text-[var(--color-gold)]">{fmt(tenYear)}</div>
          </div>
        </div>

        <p className="mt-4 font-sans text-[0.68rem] leading-relaxed text-[var(--color-muted)]">
          Estimate only, based on California state income-tax brackets and ~3% annual income growth; excludes
          deductions, credits, and local taxes. Not tax advice — consult a tax professional. Nevada has no state
          income tax.
        </p>
      </div>
    </section>
  );
}
