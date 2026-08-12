import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { HomeEstimator } from "@/components/HomeEstimator";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "What's My Home Worth? Free Las Vegas Home Value Estimate",
  description:
    "Get an instant, comp-based value range for your Las Vegas or Henderson home — pulled from the past six months of sold comparables in your ZIP. No sign-up, no obligation.",
  alternates: { canonical: "/home-value" },
};

const steps = [
  {
    n: "1",
    h: "You enter your ZIP, beds, and sqft",
    p: "We need three things — the ZIP scopes the comp pool to your neighborhood, the bedroom count keeps comparable property types, and the square footage anchors the per-sqft math.",
  },
  {
    n: "2",
    h: "We pull the past six months of sold comps",
    p: "Live Nevada MLS data (GLVAR). We pull every sold listing in your ZIP within ±20% of your sqft and ±1 bed over the past six months — typically dozens of comparables in dense metro ZIPs.",
  },
  {
    n: "3",
    h: "Trim outliers, compute median $/sqft",
    p: "We drop the top and bottom 5% of $/sqft outliers (distressed and non-arm's-length sales), then take the 25th-percentile, median, and 75th-percentile. Your sqft times those three gives the low, midpoint, and high.",
  },
  {
    n: "4",
    h: "Get a precise CMA when you're ready",
    p: "The comp median is a defensible starting number, not a listing price. Your home's condition, upgrades, lot premium, view, and HOA can swing the actual sale price ±15%. Request a free CMA and our team walks your home.",
  },
];

const faqs = [
  {
    q: "How accurate is this home value estimate?",
    a: "It's a data-backed starting range, not an appraisal. Because it's built from actual recent sold comparables in your specific ZIP — not a national model guessing from limited data — it's typically far closer than a generic automated estimate. That said, it can't see inside your home. Condition, upgrades, lot, and view can move the real number ±15%, which is exactly what a full CMA accounts for.",
  },
  {
    q: "Where does the comparable sales data come from?",
    a: "Live Nevada MLS data through our licensed IDX feed (GLVAR / Las Vegas REALTORS®). We pull sold listings recorded in the past six months in your ZIP that match your home on size and bedroom count — the same records a listing agent uses to price a home.",
  },
  {
    q: "How is the value range calculated?",
    a: "We gather sold comps in your ZIP within ±20% of your square footage and ±1 bedroom over the past six months, compute the price-per-square-foot of each, drop the top and bottom 5% as outliers, and take the 25th-percentile, median, and 75th-percentile price-per-sqft. Multiplying those by your square footage gives the low, midpoint, and high of the range.",
  },
  {
    q: "Will using this commit me to anything?",
    a: "No. The instant estimate is free, requires no email to see the number, and comes with zero obligation. If you'd like a precise figure, you can request a full CMA — but there's no pressure and no cost to do so.",
  },
  {
    q: "Why is this different from a national automated estimate?",
    a: "National estimate tools price millions of homes from public records with limited local detail, which is why they're often off by a wide margin in a specific neighborhood. This tool looks only at recent, truly comparable sales in your ZIP — local, current, and transparent about exactly how the number was built.",
  },
  {
    q: "Should I list at the midpoint or the high?",
    a: "It depends on your home and your goals. The midpoint reflects a typical comparable home; a superior lot, view, or renovation can support the high end, while deferred maintenance argues for the low. Pricing strategy — where to list to attract the right buyers and maximize your net — is exactly what we build with you in a full CMA.",
  },
];

export default function HomeValuePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Home Value", path: "/home-value" },
          ]),
          faqSchema(faqs),
        ]}
      />

      {/* Hero — estimator front and center */}
      <section className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.estate} priority />
        <Container size="wide" className="relative z-10 grid items-center gap-10 py-16 md:grid-cols-2 md:py-20">
          <div className="max-w-[540px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Free comp-based estimate
            </div>
            <h1 className="mt-3 font-serif text-[2.9rem] font-semibold leading-[1.03] text-white md:text-[3.6rem]">
              What&apos;s my home worth?
            </h1>
            <p className="mt-5 text-[1.12rem] text-[#d9dbe0]">
              Instant value range pulled from the past six months of sold comparables in your ZIP — across Las Vegas
              and Henderson. Live MLS data — no sign-up, no obligation, no email required to see the number.
            </p>
            <ul className="mt-6 space-y-2 font-sans text-[0.95rem] text-[#d9dbe0]">
              <li>✓ Real sold comps in your ZIP — not a national guess</li>
              <li>✓ See the number instantly, no email required</li>
              <li>✓ Precise, human CMA whenever you&apos;re ready</li>
            </ul>
          </div>

          <HomeEstimator />
        </Container>
      </section>

      {/* How the estimate works */}
      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-16">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-2 text-[1.9rem]">How the estimate works</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {steps.map((s) => (
              <div key={s.n} className="rounded-[12px] border border-[var(--color-line)] bg-white p-7">
                <div className="font-serif text-[1.8rem] font-semibold text-[var(--color-gold)]">{s.n}</div>
                <h3 className="mt-2 text-[1.15rem]">{s.h}</h3>
                <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{s.p}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Request a precise CMA → CloudCMA → Follow Up Boss */}
      <section id="request-cma" className="scroll-mt-24">
        <Container size="wide" className="grid items-center gap-10 py-16 md:grid-cols-2">
          <div className="max-w-[500px]">
            <div className="eyebrow">The precise number</div>
            <h2 className="mt-2 text-[1.9rem]">Get your full CMA</h2>
            <p className="mt-4 text-[1.05rem] text-[var(--color-ink-soft)]">
              The instant range is a starting point. For the real number, {site.founder.split(" ")[0]}&apos;s team
              prepares a Comparative Market Analysis based on your home&apos;s condition, upgrades, and current demand —
              then a pricing and marketing plan to maximize your sale.
            </p>
            <ul className="mt-6 space-y-2 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
              <li>✓ Free, no-obligation market analysis</li>
              <li>✓ Prepared by a local expert who tracks every sale in your neighborhood</li>
              <li>✓ Backed by {site.stats[2].value} five-star reviews</li>
            </ul>
          </div>
          <div className="rounded-[14px] bg-white p-3 shadow-[var(--shadow-soft)]">
            <iframe
              src={site.homeValueWidgetUrl}
              title="Request your free home valuation (CMA)"
              className="h-[560px] w-full rounded-[10px] border-0"
              loading="lazy"
            />
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <Container size="narrow" className="prose-body py-6 pb-16">
        <h2 className="mt-4 text-[1.6rem]">Frequently asked questions</h2>
        <div className="mt-2">
          {faqs.map((faq) => (
            <details key={faq.q} className="border-b border-[var(--color-line)] py-4">
              <summary className="cursor-pointer font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">
                {faq.q}
              </summary>
              <p className="mt-3">{faq.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </>
  );
}
