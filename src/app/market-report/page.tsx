import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { marketReport } from "@/content/market";
import { site, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Las Vegas Housing Market Report",
  description:
    "The latest Las Vegas & Henderson housing market report — median prices, days on market, inventory, and trends across the valley's key areas.",
  alternates: { canonical: "/market-report" },
};

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

export default function MarketReportPage() {
  const m = marketReport;
  const maxArea = Math.max(...m.areas.map((a) => a.medianPrice));

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Las Vegas Housing Market Report — ${m.period}`,
    about: "Las Vegas and Henderson residential real estate market",
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    url: absoluteUrl("/market-report"),
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Market Report", path: "/market-report" },
          ]),
          article,
        ]}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[var(--color-graphite)] to-[var(--color-graphite-2)] text-white">
        <Container size="wide" className="py-16 text-center">
          <div className="font-sans text-[0.78rem] uppercase tracking-[0.22em] text-[var(--color-gold-2)]">
            Market Report · {m.period}
          </div>
          <h1 className="mx-auto mt-4 max-w-[760px] text-[2.4rem] font-semibold leading-[1.15] text-white md:text-[2.9rem]">
            Las Vegas &amp; Henderson Housing Market Report
          </h1>
          <p className="mx-auto mt-4 max-w-[620px] text-[1.1rem] text-[#d9dbe0]">
            Where the market stands this month — prices, pace, and inventory across the valley.
          </p>
        </Container>
      </section>

      {/* Headline stats */}
      <Container size="wide" className="py-14">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Median Sale Price" value={usd(m.valley.medianPrice)} sub={`${pct(m.valley.priceYoY)} year-over-year`} up={m.valley.priceYoY >= 0} />
          <Stat label="Median Days on Market" value={String(m.valley.medianDom)} sub="days to contract" />
          <Stat label="Active Listings" value={m.valley.activeListings.toLocaleString()} sub={`${m.valley.closedSales.toLocaleString()} closed this month`} />
          <Stat label="Months of Supply" value={m.valley.monthsOfSupply.toFixed(1)} sub={m.valley.monthsOfSupply < 5 ? "seller-favorable" : "balanced"} />
        </div>

        {/* Area comparison */}
        <h2 className="mt-16 text-[1.7rem]">Median price by area</h2>
        <p className="mt-2 max-w-[640px] text-[var(--color-ink-soft)]">
          The valley is many markets in one. Here&apos;s how median sale prices compare across key areas this month.
        </p>

        <div className="mt-8 space-y-4">
          {m.areas.map((a) => (
            <div key={a.area} className="grid grid-cols-[130px_1fr_auto] items-center gap-4">
              <div className="font-sans text-[0.9rem] font-semibold text-[var(--color-ink)]">{a.area}</div>
              <div className="h-8 overflow-hidden rounded bg-[var(--color-sand-deep)]">
                <div
                  className="flex h-full items-center justify-end rounded bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-2)] pr-3 font-sans text-[0.75rem] font-semibold text-white"
                  style={{ width: `${Math.max(18, (a.medianPrice / maxArea) * 100)}%` }}
                >
                  {usd(a.medianPrice)}
                </div>
              </div>
              <div className={`w-16 text-right font-sans text-[0.82rem] font-semibold ${a.priceYoY >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {pct(a.priceYoY)}
              </div>
            </div>
          ))}
        </div>

        {/* Detail table */}
        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse font-sans text-[0.9rem]">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-[0.72rem] uppercase tracking-[0.06em] text-[var(--color-muted)]">
                <th className="py-3 pr-4">Area</th>
                <th className="py-3 pr-4 text-right">Median Price</th>
                <th className="py-3 pr-4 text-right">YoY</th>
                <th className="py-3 pr-4 text-right">Median DOM</th>
                <th className="py-3 text-right">Active Listings</th>
              </tr>
            </thead>
            <tbody>
              {m.areas.map((a) => (
                <tr key={a.area} className="border-b border-[var(--color-line)]">
                  <td className="py-3 pr-4 font-semibold text-[var(--color-ink)]">{a.area}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{usd(a.medianPrice)}</td>
                  <td className={`py-3 pr-4 text-right tabular-nums ${a.priceYoY >= 0 ? "text-emerald-700" : "text-red-700"}`}>{pct(a.priceYoY)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{a.medianDom}</td>
                  <td className="py-3 text-right tabular-nums">{a.activeListings.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Takeaways */}
        <h2 className="mt-16 text-[1.7rem]">What it means this month</h2>
        <ul className="mt-4 max-w-[720px] list-disc space-y-3 pl-5 text-[var(--color-ink-soft)]">
          {m.takeaways.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>

        {m.isSampleData && (
          <p className="mt-8 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-sand)] p-4 font-sans text-[0.75rem] text-[var(--color-muted)]">
            <strong>Illustrative figures.</strong> These market numbers are sample placeholders shown for layout.
            Once connected to a live MLS statistics source, this report refreshes monthly with verified data.
          </p>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.7rem] text-white">Want a report for your neighborhood?</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Valley averages only tell part of the story. Roland Luxury can pull a precise market analysis for
            your street, community, or price point.
          </p>
          <Link href={site.cta.href} className="btn mt-6">Request a Market Analysis</Link>
        </div>
      </Container>
    </>
  );
}

function Stat({ label, value, sub, up }: { label: string; value: string; sub?: string; up?: boolean }) {
  return (
    <div className="rounded-[12px] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft)]">
      <div className="font-sans text-[0.68rem] uppercase tracking-[0.08em] text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 font-sans text-[1.7rem] font-semibold tabular-nums text-[var(--color-ink)]">{value}</div>
      {sub && (
        <div className={`mt-1 font-sans text-[0.78rem] ${up === undefined ? "text-[var(--color-muted)]" : up ? "text-emerald-700" : "text-red-700"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}
