"use client";

import { useMemo, useState } from "react";

/**
 * Rent vs. Buy — compares the net cost of buying (payments minus recovered
 * equity at sale) against renting (payments minus the investment growth of the
 * cash a renter didn't tie up in a down payment) over the years you plan to
 * stay, and finds the break-even year. Educational estimate only.
 */

const money = (n: number) =>
  Math.round(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const clampNum = (v: string, min = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min ? n : min;
};

// Disclosed assumptions.
const CLOSING_BUY = 0.03; // buyer closing costs
const SELLING_COST = 0.07; // agent + closing when you sell
const TAX_RATE = 0.006; // annual property tax
const INS_RATE = 0.004; // annual insurance as % of value
const MAINT_RATE = 0.01; // annual maintenance as % of value
const INVEST_RETURN = 0.05; // what a renter earns on un-spent cash

function netCostBuy(
  price: number,
  downPct: number,
  rate: number,
  years: number,
  apprec: number
) {
  const down = price * (downPct / 100);
  const loan = price - down;
  const mr = rate / 100 / 12;
  const n = 30 * 12;
  const factor = mr > 0 ? mr / (1 - Math.pow(1 + mr, -n)) : 1 / n;
  const pi = loan * factor;
  const months = years * 12;

  let carrying = 0;
  for (let y = 0; y < years; y++) {
    const val = price * Math.pow(1 + apprec, y);
    carrying += 12 * (pi + (val * TAX_RATE) / 12 + (val * INS_RATE) / 12 + (val * MAINT_RATE) / 12);
  }
  const cashOut = down + price * CLOSING_BUY + carrying;

  const homeValue = price * Math.pow(1 + apprec, years);
  // Remaining loan balance after `months` payments.
  const balance =
    mr > 0
      ? (loan * (Math.pow(1 + mr, n) - Math.pow(1 + mr, months))) / (Math.pow(1 + mr, n) - 1)
      : loan * (1 - months / n);
  const equity = homeValue - balance - homeValue * SELLING_COST;
  return cashOut - equity;
}

function netCostRent(
  monthlyRent: number,
  years: number,
  rentGrowth: number,
  investedCash: number
) {
  let rentPaid = 0;
  for (let y = 0; y < years; y++) {
    rentPaid += monthlyRent * 12 * Math.pow(1 + rentGrowth, y);
  }
  // Opportunity gain on the cash a renter kept invested instead of putting down.
  const investGain = investedCash * (Math.pow(1 + INVEST_RETURN, years) - 1);
  return rentPaid - investGain;
}

export function RentVsBuyCalculator() {
  const [price, setPrice] = useState(500_000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [rent, setRent] = useState(2_600);
  const [years, setYears] = useState(7);
  const [apprecPct, setApprecPct] = useState(3);
  const [rentGrowthPct, setRentGrowthPct] = useState(3);

  const result = useMemo(() => {
    const apprec = apprecPct / 100;
    const rentGrowth = rentGrowthPct / 100;
    const investedCash = price * (downPct / 100) + price * CLOSING_BUY;

    const buy = netCostBuy(price, downPct, rate, years, apprec);
    const rentCost = netCostRent(rent, years, rentGrowth, investedCash);

    // Break-even: first year buying costs no more than renting.
    let breakeven: number | null = null;
    for (let y = 1; y <= 30; y++) {
      const b = netCostBuy(price, downPct, rate, y, apprec);
      const r = netCostRent(rent, y, rentGrowth, investedCash);
      if (b <= r) {
        breakeven = y;
        break;
      }
    }
    return { buy, rentCost, breakeven, cheaper: buy < rentCost ? "buy" : "rent", diff: Math.abs(buy - rentCost) };
  }, [price, downPct, rate, rent, years, apprecPct, rentGrowthPct]);

  const field =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
  const lbl = "font-sans text-[0.68rem] uppercase tracking-[0.08em] text-[var(--color-muted)]";
  const pct = (v: number, set: (n: number) => void, aria: string, max = 15, step = 0.5) => (
    <div className="mt-1 flex items-center gap-1">
      <input type="number" min={0} max={max} step={step} value={v} onChange={(e) => set(clampNum(e.target.value))} className={field} aria-label={aria} />
      <span className="text-[var(--color-muted)]">%</span>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft)]">
      <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
        <div className="p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={lbl}>Home price</span>
              <input type="number" min={0} step={10000} value={price} onChange={(e) => setPrice(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Home price" />
            </label>
            <label className="block">
              <span className={lbl}>Comparable monthly rent</span>
              <input type="number" min={0} step={50} value={rent} onChange={(e) => setRent(clampNum(e.target.value))} className={`${field} mt-1`} aria-label="Monthly rent" />
            </label>
            <label className="block">
              <span className={lbl}>Down payment</span>
              {pct(downPct, setDownPct, "Down payment percent", 100, 1)}
            </label>
            <label className="block">
              <span className={lbl}>Interest rate</span>
              {pct(rate, setRate, "Interest rate percent")}
            </label>
            <label className="block">
              <span className={lbl}>Years you&apos;ll stay</span>
              <input type="number" min={1} max={30} step={1} value={years} onChange={(e) => setYears(Math.min(30, Math.max(1, clampNum(e.target.value, 1))))} className={`${field} mt-1`} aria-label="Years staying" />
            </label>
            <label className="block">
              <span className={lbl}>Home appreciation / yr</span>
              {pct(apprecPct, setApprecPct, "Home appreciation percent", 15, 0.5)}
            </label>
            <label className="block">
              <span className={lbl}>Rent increase / yr</span>
              {pct(rentGrowthPct, setRentGrowthPct, "Rent increase percent", 15, 0.5)}
            </label>
          </div>
          <p className="mt-5 font-sans text-[0.66rem] leading-relaxed text-[var(--color-muted)]">
            Assumes a 30-year loan, ~3% buyer closing costs, ~7% selling costs, ~0.6% property tax, and that a
            renter invests the un-spent down payment at ~5%. Estimate only — your taxes, HOA, and market will
            differ. Not financial advice.
          </p>
        </div>

        <div className="border-t border-[var(--color-line)] bg-[var(--color-sand)] p-6 md:border-l md:border-t-0 md:p-8">
          <div className="font-sans text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Over {years} years, {result.cheaper === "buy" ? "buying" : "renting"} is cheaper by
          </div>
          <div className="mt-1 font-serif text-[2.6rem] leading-none text-[var(--color-gold)]">
            {money(result.diff)}
          </div>
          <dl className="mt-5 space-y-2.5 font-sans text-[0.9rem]">
            <div className="flex justify-between border-b border-[var(--color-line)] pb-2">
              <dt className="text-[var(--color-ink-soft)]">Net cost to buy</dt>
              <dd className="font-semibold text-[var(--color-ink)]">{money(result.buy)}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-line)] pb-2">
              <dt className="text-[var(--color-ink-soft)]">Net cost to rent</dt>
              <dd className="font-semibold text-[var(--color-ink)]">{money(result.rentCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Break-even point</dt>
              <dd className="font-semibold text-[var(--color-ink)]">
                {result.breakeven ? `Year ${result.breakeven}` : "Beyond 30 yrs"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 font-sans text-[0.72rem] leading-relaxed text-[var(--color-ink-soft)]">
            &ldquo;Net cost&rdquo; counts payments minus the equity (or investment growth) you keep at the end.
          </p>
        </div>
      </div>
    </div>
  );
}
