"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePortal } from "@/lib/portal/store";
import { trackPortal } from "@/lib/portal/track";
import { Card, CardTitle, fieldClass, labelClass, money } from "./ui";

/**
 * "My numbers" — the client's own copy of the math.
 *
 * Buyers get monthly payment, cash to close, and a 28/36 affordability read.
 * Sellers get estimated net proceeds. All of it is transparent arithmetic the
 * client can check, and all of it is clearly an estimate, not a quote.
 *
 * Defaults are Las Vegas / Clark County specific and marked below so they're
 * easy to keep current.
 */

// Clark County effective property tax runs roughly 0.5–0.75% of value a year
// once the 35% assessment ratio is applied. 0.6% is a fair planning default.
const DEFAULT_TAX_RATE = 0.6;
const DEFAULT_RATE = 6.5;
// Buyer-side closing costs in Nevada typically land around 2–3% of price.
const BUYER_CLOSING_PCT = 2.5;

function num(v: string, fallback = 0): number {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 ${strong ? "border-t border-[var(--color-line)] pt-3" : ""}`}>
      <span className={`font-sans text-[0.88rem] ${strong ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>
        {label}
      </span>
      <span className={`font-sans tabular-nums ${strong ? "text-[1.05rem] font-semibold text-[var(--color-ink)]" : "text-[0.92rem] text-[var(--color-ink)]"}`}>
        {value}
      </span>
    </div>
  );
}

export function BudgetPlanner() {
  const { state } = usePortal();
  const profile = state.profile;
  const isSeller = profile?.journey === "sell";

  useEffect(() => {
    trackPortal("portal.budget", isSeller ? "Opened the net-proceeds planner" : "Opened the budget planner");
  }, [isSeller]);

  if (!profile) return null;
  return isSeller ? <SellerNumbers startPrice={profile.budget} /> : <BuyerNumbers startPrice={profile.budget} />;
}

/* ------------------------------------------------------------------ buyer -- */

function BuyerNumbers({ startPrice }: { startPrice: number }) {
  const [price, setPrice] = useState(startPrice > 0 ? startPrice : 550_000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [term, setTerm] = useState(30);
  const [hoa, setHoa] = useState(75);
  const [insurance, setInsurance] = useState(140);
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const [income, setIncome] = useState(0);
  const [debts, setDebts] = useState(0);

  const down = price * (downPct / 100);
  const loan = Math.max(0, price - down);
  const mr = rate / 100 / 12;
  const n = term * 12;
  const pi = mr > 0 ? (loan * mr) / (1 - Math.pow(1 + mr, -n)) : loan / n;
  const taxes = (price * (taxRate / 100)) / 12;
  const monthly = pi + taxes + insurance + hoa;
  const closingCosts = price * (BUYER_CLOSING_PCT / 100);
  const cashToClose = down + closingCosts;

  // 28/36: housing ≤28% of gross monthly income, all debt ≤36%.
  const grossMonthly = income / 12;
  const frontRatio = grossMonthly > 0 ? (monthly / grossMonthly) * 100 : null;
  const backRatio = grossMonthly > 0 ? ((monthly + debts) / grossMonthly) * 100 : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <Card>
        <CardTitle hint="Estimates only">Your purchase</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Home price" value={price} onChange={setPrice} prefix="$" />
          <Field label="Down payment %" value={downPct} onChange={setDownPct} suffix="%" step={0.5} />
          <Field label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.125} />
          <label className="block">
            <span className={labelClass}>Loan term</span>
            <select className={`${fieldClass} mt-1`} value={term} onChange={(e) => setTerm(Number(e.target.value))}>
              <option value={30}>30 years</option>
              <option value={20}>20 years</option>
              <option value={15}>15 years</option>
            </select>
          </label>
          <Field label="HOA / month" value={hoa} onChange={setHoa} prefix="$" />
          <Field label="Insurance / month" value={insurance} onChange={setInsurance} prefix="$" />
          <Field label="Property tax rate" value={taxRate} onChange={setTaxRate} suffix="%" step={0.05} />
        </div>

        <div className="mt-7 border-t border-[var(--color-line)] pt-5">
          <div className={labelClass}>Optional — affordability check</div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Household income / year" value={income} onChange={setIncome} prefix="$" />
            <Field label="Other monthly debt" value={debts} onChange={setDebts} prefix="$" />
          </div>
          {frontRatio !== null && backRatio !== null && (
            <div className="mt-4 rounded-md bg-[var(--color-sand)] p-4 font-sans text-[0.86rem] text-[var(--color-ink-soft)]">
              This payment is <strong>{frontRatio.toFixed(0)}%</strong> of your gross monthly income, and{" "}
              <strong>{backRatio.toFixed(0)}%</strong> with your other debt included. Lenders commonly look for roughly
              28% and 36% — above that, expect a stricter file, not necessarily a no.
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <div className={labelClass}>Estimated monthly payment</div>
          <div className="mt-1 font-serif text-[2.6rem] leading-none text-[var(--color-gold)]">
            {money(monthly)}
            <span className="ml-1 font-sans text-[0.85rem] text-[var(--color-muted)]">/mo</span>
          </div>
          <div className="mt-5">
            <Row label="Principal & interest" value={money(pi)} />
            <Row label="Property taxes" value={money(taxes)} />
            <Row label="Homeowners insurance" value={money(insurance)} />
            <Row label="HOA" value={money(hoa)} />
            <Row label="Total monthly" value={money(monthly)} strong />
          </div>
        </Card>

        <Card>
          <div className={labelClass}>Estimated cash to close</div>
          <div className="mt-1 font-serif text-[2rem] leading-none text-[var(--color-ink)]">{money(cashToClose)}</div>
          <div className="mt-4">
            <Row label={`Down payment (${downPct}%)`} value={money(down)} />
            <Row label={`Closing costs (~${BUYER_CLOSING_PCT}%)`} value={money(closingCosts)} />
            <Row label="Loan amount" value={money(loan)} strong />
          </div>
          <p className="mt-4 font-sans text-[0.78rem] leading-relaxed text-[var(--color-muted)]">
            Estimates for planning, not a loan offer or a Loan Estimate. Taxes, insurance, HOA and closing costs vary by
            property. A lender pre-approval gives you the real numbers —{" "}
            <Link href="/mortgage-pre-approval" className="text-[var(--color-gold)] no-underline">request one here</Link>.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- seller -- */

function SellerNumbers({ startPrice }: { startPrice: number }) {
  const [price, setPrice] = useState(startPrice > 0 ? startPrice : 650_000);
  const [payoff, setPayoff] = useState(0);
  const [commissionPct, setCommissionPct] = useState(5);
  const [closingPct, setClosingPct] = useState(1.5);
  const [repairs, setRepairs] = useState(0);
  const [concessions, setConcessions] = useState(0);

  const commission = price * (commissionPct / 100);
  const closing = price * (closingPct / 100);
  const net = price - payoff - commission - closing - repairs - concessions;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <Card>
        <CardTitle hint="Estimates only">Your sale</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Expected sale price" value={price} onChange={setPrice} prefix="$" />
          <Field label="Mortgage payoff" value={payoff} onChange={setPayoff} prefix="$" />
          <Field label="Total commission" value={commissionPct} onChange={setCommissionPct} suffix="%" step={0.25} />
          <Field label="Title, escrow & fees" value={closingPct} onChange={setClosingPct} suffix="%" step={0.25} />
          <Field label="Repairs / prep" value={repairs} onChange={setRepairs} prefix="$" />
          <Field label="Buyer concessions" value={concessions} onChange={setConcessions} prefix="$" />
        </div>
        <p className="mt-5 font-sans text-[0.82rem] leading-relaxed text-[var(--color-muted)]">
          Commission is negotiable and set in your listing agreement — the default here is a planning placeholder, not a
          rate. Prorated taxes and HOA dues also settle at closing and aren&apos;t modeled.
        </p>
      </Card>

      <Card>
        <div className={labelClass}>Estimated net proceeds</div>
        <div className="mt-1 font-serif text-[2.6rem] leading-none text-[var(--color-gold)]">{money(Math.max(0, net))}</div>
        <div className="mt-5">
          <Row label="Sale price" value={money(price)} />
          <Row label="Mortgage payoff" value={`− ${money(payoff)}`} />
          <Row label={`Commission (${commissionPct}%)`} value={`− ${money(commission)}`} />
          <Row label={`Title, escrow & fees (${closingPct}%)`} value={`− ${money(closing)}`} />
          <Row label="Repairs / prep" value={`− ${money(repairs)}`} />
          <Row label="Concessions" value={`− ${money(concessions)}`} />
          <Row label="Estimated net" value={money(net)} strong />
        </div>
        {net < 0 && (
          <p className="mt-3 font-sans text-[0.85rem] text-[var(--color-ink-soft)]">
            This scenario nets below zero — worth a conversation before listing. There are usually options.
          </p>
        )}
        <p className="mt-4 font-sans text-[0.78rem] leading-relaxed text-[var(--color-muted)]">
          Want the accurate version?{" "}
          <Link href="/home-value" className="text-[var(--color-gold)] no-underline">Start with a current valuation</Link>{" "}
          and we&apos;ll build a seller net sheet on your actual payoff.
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ input -- */

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <div className="mt-1 flex items-center gap-1.5">
        {prefix && <span className="font-sans text-[0.9rem] text-[var(--color-muted)]">{prefix}</span>}
        <input
          className={fieldClass}
          type="number"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(num(e.target.value))}
        />
        {suffix && <span className="font-sans text-[0.9rem] text-[var(--color-muted)]">{suffix}</span>}
      </div>
    </label>
  );
}
