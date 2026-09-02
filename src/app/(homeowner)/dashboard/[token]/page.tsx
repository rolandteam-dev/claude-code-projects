import { homeownerStore, latestEstimate, appreciation } from "@/lib/homeowners/store";
import { homeownerBrand } from "@/lib/homeowners/brand";
import { HomeownerDashboard } from "@/components/HomeownerDashboard";
import { recentComps, zipMarketStats } from "@/lib/idx/market";
import { fetchEstimate } from "@/lib/homeowners/avm";

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
  // value it from its address and persist — so imported contacts get a number
  // without pre-valuing all 30k+ up front.
  if (h && !latest) {
    const est = await fetchEstimate(h);
    if (est) {
      await homeownerStore().addEstimate(token, est);
      h.estimates.push(est);
      latest = est;
    }
  }

  if (!h || !latest) {
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
