import { homeownerStore, latestEstimate, appreciation } from "@/lib/homeowners/store";
import { homeownerBrand } from "@/lib/homeowners/brand";
import { HomeownerDashboard } from "@/components/HomeownerDashboard";
import { recentComps, zipMarketStats } from "@/lib/idx/market";
import { valueHome } from "@/lib/homeowners/nvValue";

// Token-addressed, per-recipient page — always rendered on demand.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const h = await homeownerStore().getByToken(token);
  let latest = h ? latestEstimate(h) : null;

  // Lazy valuation: the first time a tracked home with no estimate is opened,
  // value it from its address (Nevada homes, via the MLS) and persist — so
  // imported contacts get a number without pre-valuing all 30k+ up front.
  if (h && !latest) {
    const est = await valueHome(h);
    if (est) {
      await homeownerStore().addEstimate(token, est);
      h.estimates.push(est);
      latest = est;
    }
  }

  // No stored home for this token — the link is genuinely inactive.
  if (!h) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <div className="font-serif text-[1.7rem] text-[var(--color-ink)]">This link isn&apos;t active</div>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Your home value link may have expired or moved. {homeownerBrand.founder}&apos;s team is happy to send a
          fresh report — just reach out.
        </p>
        <a
          href={`tel:${homeownerBrand.phone}`}
          className="mt-6 inline-block rounded-full bg-[var(--color-gold)] px-6 py-2.5 font-sans text-[0.9rem] font-semibold text-white no-underline"
        >
          Call {homeownerBrand.phone}
        </a>
      </div>
    );
  }

  // The home is tracked but we couldn't auto-value it (out-of-state, or no MLS
  // history to pull beds/baths/sqft from). Show a personal "request your
  // valuation" CTA instead of a dead end — it routes to the team like any lead.
  if (!latest) {
    const name = [h.firstName, h.lastName].filter(Boolean).join(" ").trim();
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <div className="font-serif text-[1.7rem] text-[var(--color-ink)]">
          {name ? `${h.firstName}, let's value your home` : "Let's value your home"}
        </div>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          {h.address ? (
            <>
              We&apos;re preparing a current-market valuation for{" "}
              <span className="font-semibold text-[var(--color-ink)]">{h.address}</span>. A few details about the
              home let {homeownerBrand.founder} tailor it precisely — reach out and we&apos;ll send your full report.
            </>
          ) : (
            <>
              {homeownerBrand.founder}&apos;s team prepares a current-market valuation by hand for homes like yours.
              Reach out and we&apos;ll send your full report.
            </>
          )}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={`tel:${homeownerBrand.phone}`}
            className="inline-block rounded-full bg-[var(--color-gold)] px-6 py-2.5 font-sans text-[0.9rem] font-semibold text-white no-underline"
          >
            Call {homeownerBrand.phone}
          </a>
          <a
            href={`mailto:${homeownerBrand.email}?subject=${encodeURIComponent(
              `Home valuation request${h.address ? ` — ${h.address}` : ""}`,
            )}`}
            className="inline-block rounded-full border border-[var(--color-gold)] px-6 py-2.5 font-sans text-[0.9rem] font-semibold text-[var(--color-ink)] no-underline"
          >
            Request my report
          </a>
        </div>
      </div>
    );
  }

  // Neighborhood context (graceful: empty/null when the feed isn't configured).
  const [comps, market] = await Promise.all([
    recentComps({ zip: h.zip, beds: h.beds, sqft: h.sqft }),
    zipMarketStats({ zip: h.zip }),
  ]);

  return (
    <HomeownerDashboard
      token={h.token}
      firstName={h.firstName}
      lastName={h.lastName}
      email={h.email}
      phone={h.phone}
      address={h.address}
      city={h.city}
      state={h.state}
      zip={h.zip}
      currentValue={latest.value}
      low={latest.low}
      high={latest.high}
      asOf={latest.date}
      series={h.estimates.map((e) => ({ date: e.date, value: e.value }))}
      appreciation={appreciation(h)}
      market={market}
      comps={comps}
    />
  );
}
