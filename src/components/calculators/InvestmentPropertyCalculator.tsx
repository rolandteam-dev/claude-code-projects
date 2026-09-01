"use client";

import { useState } from "react";

/**
 * Investment Property analyzer — computes NOI, cap rate, monthly cash flow, and
 * cash-on-cash return for a rental, accounting for financing, vacancy, and
 * operating expenses. Educational estimate only.
 */

const money = (n: number) =>
  Math.round(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pctStr = (n: number) => `${(n * 100).toFixed(1)}%`;
const clampNum = (v: string, min = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min ? n : min;
};

const CLOSING = 0.03; // acquisition closing costs as % of price

export function InvestmentPropertyCalculator() {
  const [price, setPrice] = useState(450_000);
  const [downPct, setDownPct] = useState(25);
  const [rate, setRate] = useState(7);
  const [rent, setRent] = useState(2_800);
  const [taxAnnual, setTaxAnnual] = useState(2_700);
  const [insAnnual, setInsAnnual] = useState(1_400);
  const [hoaMonthly, setHoaMonthly] = useState(0);
  const [vacancyPct, setVacancyPct] = useState(5);
  const [maintPct, setMaintPct] = useState(8);
  const [mgmtPct, setMgmtPct] = useState(8);

  const down = price * (downPct / 100);
  const loan = price - down;
  const mr = rate / 100 / 12;
  const n = 30 * 12;
  const pi = mr > 0 ? (loan * mr) / (1 - Math.pow(1 + mr, -n)) : loan / n;

  const grossAnnual = rent * 12;
  const vacancy = grossAnnual * (vacancyPct / 100);
  const egi = grossAnnual - vacancy; // effective gross income
  const maintenance = grossAnnual * (maintPct / 100);
  const management = egi * (mgmtPct / 100);
  const operatingExp = taxAnnual + insAnnual + hoaMonthly * 12 + maintenance + management;
  const noi = egi - operatingExp;
  const capRate = price > 0 ? noi / price : 0;
  const annualDebt = pi * 12;
  const annualCashFlow = noi - annualDebt;
  const monthlyCashFlow = annualCashFlow / 12;
  const cashInvested = down + price * CLOSING;
  const cashOnCash = cashInvested > 0 ? annualCashFlow / cashInvested : 0;

  const field =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 font-sans text-[0.9rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
  const lbl = "font-sans text-[0.64rem] uppercase tracking-[0.07em] text-[var(--color-muted)]";
  const pctInput = (v: number, set: (n: number) => void, aria: string, max = 100) => (
    <div className="mt-1 flex items-center gap-1">
      <input type="number" min={0} max={max} step={0.5} value={v} onChange={(e) => set(clampNum(e.target.value))} className={field} aria-label={aria} />
      <span className="text-[var(--color-muted)]">%</span>
    </div>
  );

  const positive = monthlyCashFlow >= 0;

  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft)]">
      <div className="grid gap-0 md:grid-cols-[1.3fr_1fr]">
        <div className="p-6 md:p-8">
          <div className="grid gap-3.5 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className={lbl}>Purchase price</span>
              <input type="number" min={0} step={10000} value={price} onChange={(e) => setPrice(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Purchase price" />
            </label>
            <label className="block">
              <span className={lbl}>Down payment</span>
              {pctInput(downPct, setDownPct, "Down payment percent")}
            </label>
            <label className="block">
              <span className={lbl}>Interest rate</span>
              {pctInput(rate, setRate, "Interest rate percent", 15)}
            </label>
            <label className="block">
              <span className={lbl}>Monthly rent</span>
              <input type="number" min={0} step={50} value={rent} onChange={(e) => setRent(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Monthly rent" />
            </label>
            <label className="block">
              <span className={lbl}>HOA / mo</span>
              <input type="number" min={0} step={10} value={hoaMonthly} onChange={(e) => setHoaMonthly(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Monthly HOA" />
            </label>
            <label className="block">
              <span className={lbl}>Property tax / yr</span>
              <input type="number" min={0} step={100} value={taxAnnual} onChange={(e) => setTaxAnnual(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Annual property tax" />
            </label>
            <label className="block">
              <span className={lbl}>Insurance / yr</span>
              <input type="number" min={0} step={100} value={insAnnual} onChange={(e) => setInsAnnual(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Annual insurance" />
            </label>
            <label className="block">
              <span className={lbl}>Vacancy</span>
              {pctInput(vacancyPct, setVacancyPct, "Vacancy percent")}
            </label>
            <label className="block">
              <span className={lbl}>Maintenance</span>
              {pctInput(maintPct, setMaintPct, "Maintenance percent")}
            </label>
            <label className="block">
              <span className={lbl}>Management</span>
              {pctInput(mgmtPct, setMgmtPct, "Management percent")}
            </label>
          </div>
          <p className="mt-5 font-sans text-[0.66rem] leading-relaxed text-[var(--color-muted)]">
            Assumes a 30-year loan and ~3% acquisition closing costs. Vacancy and maintenance are figured on gross
            rent; management on collected rent. Estimate only — not investment, tax, or lending advice.
          </p>
        </div>

        <div className="border-t border-[var(--color-line)] bg-[var(--color-sand)] p-6 md:border-l md:border-t-0 md:p-8">
          <div className="font-sans text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Monthly cash flow
          </div>
          <div className={`mt-1 font-serif text-[2.6rem] leading-none ${positive ? "text-[var(--color-gold)]" : "text-[#b4433a]"}`}>
            {monthlyCashFlow < 0 ? `−${money(-monthlyCashFlow)}` : money(monthlyCashFlow)}
            <span className="ml-1 font-sans text-[0.8rem] text-[var(--color-muted)]">/mo</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-[var(--color-line)] bg-white p-3.5">
              <div className="font-sans text-[0.6rem] uppercase tracking-[0.1em] text-[var(--color-muted)]">Cap rate</div>
              <div className="mt-0.5 font-serif text-[1.5rem] text-[var(--color-ink)]">{pctStr(capRate)}</div>
            </div>
            <div className="rounded-[10px] border border-[var(--color-line)] bg-white p-3.5">
              <div className="font-sans text-[0.6rem] uppercase tracking-[0.1em] text-[var(--color-muted)]">Cash-on-cash</div>
              <div className="mt-0.5 font-serif text-[1.5rem] text-[var(--color-ink)]">{pctStr(cashOnCash)}</div>
            </div>
          </div>
          <dl className="mt-4 space-y-2 font-sans text-[0.86rem]">
            <div className="flex justify-between border-b border-[var(--color-line)] pb-1.5">
              <dt className="text-[var(--color-ink-soft)]">Net operating income</dt>
              <dd className="font-semibold text-[var(--color-ink)]">{money(noi)}/yr</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-line)] pb-1.5">
              <dt className="text-[var(--color-ink-soft)]">Annual debt service</dt>
              <dd className="font-semibold text-[var(--color-ink)]">{money(annualDebt)}/yr</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Cash invested</dt>
              <dd className="font-semibold text-[var(--color-ink)]">{money(cashInvested)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
