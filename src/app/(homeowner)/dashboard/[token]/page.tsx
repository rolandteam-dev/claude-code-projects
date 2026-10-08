import { homeownerStore, latestEstimate, appreciation } from "@/lib/homeowners/store";
import { homeownerBrand } from "@/lib/homeowners/brand";
import { HomeownerDashboard } from "@/components/HomeownerDashboard";
import { HomeDetailsForm } from "@/components/HomeDetailsForm";
import { recentComps, zipMarketStats } from "@/lib/idx/market";
import { valueHome, type ValueReason } from "@/lib/homeowners/nvValue";
import { mortgageRates } from "@/lib/homeowners/rates";
import { staticMapUrl, googleReviews } from "@/lib/homeowners/maps";

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
  let reason: ValueReason | null = null;

  // Lazy valuation: the first time a tracked home with no estimate is opened,
  // value it from its address (Nevada homes, via the MLS) and persist — so
  // imported contacts get a number without pre-valuing all 30k+ up front.
  // Never invents beds/baths/sqft: if the home can't be resolved, `reason`
  // drives a "tell us about your home" form instead of a fabricated number.
  if (h && !latest) {
    const r = await valueHome(h);
    reason = r.reason;
    if (r.facts) {
      await homeownerStore().updateFacts(token, r.facts);
      // reflect locally so this render shows the facts row + comp comparisons
      h.beds = h.beds || r.facts.beds || undefined;
      h.baths = h.baths || r.facts.baths || undefined;
      h.sqft = h.sqft || r.facts.sqft || undefined;
    }
    if (r.estimate) {
      await homeownerStore().addEstimate(token, r.estimate);
      h.estimates.push(r.estimate);
      latest = r.estimate;
    }
  }

  // No stored home for this token — the link is genuinely inactive.
  if (!h) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <div className="font-serif text-[1.7rem] text-[var(--color-ink)]">This link isn&apos;t active</div>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Your home value link may have expired or moved. {homeownerBrand.name} is happy to send a
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
    // For Nevada homes we couldn't auto-resolve, collect the details from the
    // owner and value from real comps — never a fabricated number. Out-of-state
    // homes (no GLVAR coverage) keep the hand-valuation CTA.
    const showForm = reason !== "out_of_state";
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <div className="font-serif text-[1.7rem] text-[var(--color-ink)]">
          {name ? `${h.firstName}, let's value your home` : "Let's value your home"}
        </div>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          {showForm ? (
            <>
              {h.address ? (
                <>
                  Tell us a couple of quick details about{" "}
                  <span className="font-semibold text-[var(--color-ink)]">{h.address}</span>{" "}and we&apos;ll pull
                  an instant estimate from recent sold comparables.
                </>
              ) : (
                <>Tell us a couple of quick details and we&apos;ll pull an instant estimate from recent sold comparables.</>
              )}
            </>
          ) : (
            <>
              {homeownerBrand.name} prepares a current-market valuation by hand for homes like yours.
              Reach out and we&apos;ll send your full report.
            </>
          )}
        </p>

        {showForm && <HomeDetailsForm token={h.token} />}

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
            {showForm ? "Or have us run it by hand" : "Request my report"}
          </a>
        </div>
      </div>
    );
  }

  // Neighborhood context (graceful: empty/null when the feed isn't configured).
  const [comps, market, rates, reviews] = await Promise.all([
    recentComps({ zip: h.zip, beds: h.beds, sqft: h.sqft }),
    zipMarketStats({ zip: h.zip }),
    mortgageRates(),
    googleReviews(),
  ]);
  const mapUrl = staticMapUrl({ subject: { address: h.address, city: h.city, state: h.state, zip: h.zip }, comps });

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
      beds={h.beds}
      baths={h.baths}
      sqft={h.sqft}
      buyingVideoId={process.env.BUYING_VIDEO_ID || "DGQMJufo4l8"}
      currentValue={latest.value}
      low={latest.low}
      high={latest.high}
      asOf={latest.date}
      series={h.estimates.map((e) => ({ date: e.date, value: e.value }))}
      appreciation={appreciation(h)}
      market={market}
      comps={comps}
      rates={rates}
      mapUrl={mapUrl}
      reviews={reviews}
    />
  );
}
