import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { site } from "@/lib/site";
import { testimonials } from "@/content/testimonials";

export const metadata: Metadata = {
  title: "Sell Your Las Vegas Home | The Roland Team",
  description:
    "Sell your Las Vegas or Henderson home for more, with less stress. Precision pricing, luxury marketing, and expert negotiation from a Top 1% team with 1,000+ homes sold.",
  alternates: { canonical: "/sell" },
};

const whyPoints = [
  { h: "Precision pricing", p: "We price to the current market using real comparable sales — not guesswork — so your home attracts serious buyers fast and sells for its full value." },
  { h: "Luxury marketing", p: "Professional photography, video, a custom property website, and targeted digital campaigns put your home in front of the right buyers from day one." },
  { h: "Expert negotiation", p: "We protect your equity and your timeline, negotiating price, contingencies, and terms that maximize your net proceeds." },
];

const steps = [
  { n: "1", h: "Free market analysis", p: "We start with a complimentary CMA — a detailed analysis of comparable sales, active competition, and market trends. You'll know exactly what your home is worth before you sign anything." },
  { n: "2", h: "Strategic pricing", p: "Pricing is the most important decision you'll make. We set a price that reflects real market data, your timeline, and your financial goals — then explain our reasoning so you feel confident." },
  { n: "3", h: "Professional marketing", p: "Professional photography, MLS listing, syndication to the major portals, targeted social media ads, and email to our buyer database. Maximum visibility from day one." },
  { n: "4", h: "Showings & offers", p: "We coordinate showings, gather feedback after each one, and monitor buyer activity. When offers arrive, we present every one with a full analysis and our recommendation." },
  { n: "5", h: "Negotiation", p: "We negotiate with one goal: maximum net proceeds with minimum hassle. Price, contingencies, repairs, or closing timeline — we protect your interests at every turn." },
  { n: "6", h: "Close", p: "We manage escrow, title, and every deadline. You show up to closing, sign, and collect your proceeds. We handle the rest." },
];

const marketing = [
  { h: "Professional HDR photography", p: "Magazine-quality images by a real estate photographer who knows how to make your home shine." },
  { h: "Aerial & drone photography", p: "Lot, neighborhood, and proximity shots that give buyers the full picture." },
  { h: "3D virtual tour", p: "An interactive walkthrough so out-of-town and relocating buyers can tour anytime." },
  { h: "Custom property website", p: "A dedicated page for your home with gallery, details, and its own lead capture." },
  { h: "MLS + major-portal syndication", p: "Your listing goes live across the MLS and the portals buyers actually search." },
  { h: "Targeted social media ads", p: "Paid Facebook and Instagram campaigns geo-targeted to likely buyers." },
  { h: "Email to our buyer database", p: "Your home hits our active buyer list — and our sphere of local agents — on day one." },
  { h: "Open house & broker outreach", p: "Agent-hosted open houses and broker networking to reach qualified buyers fast." },
  { h: "Weekly seller reporting", p: "Showing counts, online views, ad performance, and market feedback — every week." },
];

const faqs = [
  {
    q: "How long does it take to sell a home in Las Vegas?",
    a: "It depends on price band, condition, and how the home is priced out of the gate. A well-priced, well-marketed home in a in-demand area moves faster than a home priced ahead of the market. In your CMA we'll give you a realistic time-on-market estimate for your specific home and neighborhood.",
  },
  {
    q: "How do you decide what to list my home for?",
    a: "We build a Comparative Market Analysis from recent comparable sales, active competition, and current demand in your neighborhood, then factor in your home's condition, upgrades, lot, and view. We recommend a price — and a strategy — designed to attract the right buyers and maximize your net proceeds, and we explain the reasoning so you're comfortable with the number.",
  },
  {
    q: "Do I need to stage or make repairs before listing?",
    a: "Not always. Some homes are ready to list as-is; others benefit from targeted, high-return improvements. Before you spend a dollar, we walk your home and tell you exactly where a small investment pays off and where it won't — so you're not over-improving on your way out the door.",
  },
  {
    q: "What is a CMA, and how is it different from an automated estimate?",
    a: "A CMA (Comparative Market Analysis) is a human, hyperlocal pricing analysis built by an agent who tracks every sale in your neighborhood. An automated estimate is a national model guessing from limited public data. Our instant home-value tool gives you a data-backed starting range; a CMA refines it with the details no algorithm can see.",
  },
  {
    q: "Should I sell now or wait?",
    a: "That's a personal decision that depends on your goals, your next move, and where the market is in your price band. We'll show you current conditions with real numbers — not headlines — so you can decide with confidence. There's no pressure either way.",
  },
  {
    q: "What does it cost to sell, and how is commission handled?",
    a: "Commissions are negotiable and we discuss them transparently up front, along with a clear net-proceeds estimate so you know what you'll actually take home before you list. Requesting a valuation or consultation is always free and comes with no obligation.",
  },
];

export default function SellHub() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Sell a Home", path: "/sell" },
          ]),
          faqSchema(faqs),
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.golf} priority />
        <Container size="wide" className="relative z-10 py-16 md:py-24">
          <div className="max-w-[680px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Sell with The Roland Team
            </div>
            <h1 className="mt-3 font-serif text-[2.8rem] font-semibold leading-[1.04] text-white md:text-[3.7rem]">
              Sell your Las Vegas home for more
            </h1>
            <p className="mt-5 max-w-[600px] text-[1.15rem] leading-relaxed text-[#d9dbe0]">
              Precision pricing, luxury marketing, and expert negotiation from a Top 1% Las Vegas team with 1,000+
              homes sold. Start with your instant home value — then a precise, human CMA.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/home-value" className="btn">What&apos;s my home worth?</Link>
              <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Talk to the team
              </Link>
            </div>
            {/* Stats bar */}
            <div className="mt-10 grid max-w-[560px] grid-cols-2 gap-6 sm:grid-cols-4">
              {site.stats.map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-[1.7rem] font-semibold text-[var(--color-gold-2)]">{s.value}</div>
                  <div className="font-sans text-[0.72rem] leading-tight text-[#c7cad1]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Why list with us */}
      <Container size="wide" className="py-16">
        <div className="eyebrow">Why choose us</div>
        <h2 className="mt-2 text-[1.9rem]">Why sell with The Roland Team?</h2>
        <p className="mt-3 max-w-[640px] text-[1.05rem] text-[var(--color-ink-soft)]">
          We don&apos;t just list homes — we market them, price them right, and negotiate hard for your bottom line.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {whyPoints.map((pt) => (
            <div key={pt.h} className="rounded-[12px] border border-[var(--color-line)] bg-white p-7">
              <h3 className="text-[1.25rem]">{pt.h}</h3>
              <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{pt.p}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* 6-step process */}
      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-16">
          <div className="eyebrow">The process</div>
          <h2 className="mt-2 text-[1.9rem]">How we sell your home in 6 steps</h2>
          <p className="mt-3 max-w-[640px] text-[1.05rem] text-[var(--color-ink-soft)]">
            A transparent, step-by-step approach from your first conversation to the closing table.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-[12px] border-l-2 border-[var(--color-gold)] bg-white p-7 shadow-[var(--shadow-soft)]">
                <div className="font-serif text-[1.8rem] font-semibold text-[var(--color-gold)]">{s.n}</div>
                <h3 className="mt-2 text-[1.15rem]">{s.h}</h3>
                <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{s.p}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Marketing */}
      <Container size="wide" className="py-16">
        <div className="eyebrow">Marketing</div>
        <h2 className="mt-2 text-[1.9rem]">How we market your home</h2>
        <p className="mt-3 max-w-[640px] text-[1.05rem] text-[var(--color-ink-soft)]">
          Every listing gets a full-service marketing plan built to reach the right buyers and sell for top dollar.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {marketing.map((m, i) => (
            <div key={m.h} className="rounded-[12px] border border-[var(--color-line)] bg-white p-6">
              <div className="font-serif text-[1.2rem] font-semibold text-[var(--color-gold)]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-1 text-[1.05rem]">{m.h}</h3>
              <p className="mt-2 text-[0.9rem] text-[var(--color-ink-soft)]">{m.p}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* Testimonials */}
      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-16">
          <div className="text-center">
            <div className="eyebrow">Seller success</div>
            <h2 className="mt-2 text-[1.9rem]">What Las Vegas sellers say</h2>
          </div>
          <div className="mx-auto mt-8 grid max-w-[900px] gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <figure key={t.quote} className="rounded-[12px] border border-[var(--color-line)] bg-white p-7">
                <div className="font-sans text-[0.9rem] text-[var(--color-gold)]">{"★".repeat(t.rating)}</div>
                <blockquote className="mt-3 text-[1.05rem] leading-relaxed text-[var(--color-ink)]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 font-sans text-[0.82rem] text-[var(--color-muted)]">
                  {t.author} · {t.location}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/testimonials" className="font-sans text-[0.9rem] font-semibold text-[var(--color-gold)] no-underline hover:underline">
              Read more of our 800+ five-star reviews →
            </Link>
          </div>
        </Container>
      </section>

      {/* Author / E-E-A-T box */}
      <Container size="wide" className="py-14">
        <div className="mx-auto max-w-[820px] rounded-[14px] border border-[var(--color-line)] bg-white p-7 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {site.founderPhoto ? (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[var(--color-graphite)]">
                <Image src={site.founderPhoto} alt={site.founder} fill sizes="96px" className="object-cover object-top" />
              </div>
            ) : null}
            <div>
              <div className="font-sans text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-gold)]">
                Reviewed by
              </div>
              <div className="mt-1 font-serif text-[1.5rem] font-semibold text-[var(--color-ink)]">{site.founder}</div>
              <div className="font-sans text-[0.85rem] text-[var(--color-ink-soft)]">
                {site.founderTitle} · {site.brokerage}
              </div>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--color-ink-soft)]">
                Mike leads a Top 1% Las Vegas real estate team that has sold 1,000+ homes and earned 800+ five-star
                reviews since {site.foundedYear}, across Summerlin, Henderson, MacDonald Highlands, The Ridges, Lake Las
                Vegas, and the broader Clark County market.
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* Seller guides */}
      <Container size="wide" className="pb-8">
        <h2 className="text-[1.7rem]">Selling guides for Las Vegas homeowners</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Selling Your Home in Las Vegas", desc: "The full step-by-step guide.", href: "/guides/selling-your-home-in-las-vegas" },
            { title: "Preparing Your Home to Sell", desc: "Where to focus before you list.", href: "/blog/preparing-your-las-vegas-home-to-sell" },
            { title: "Seller Net Proceeds", desc: "What you'll actually take home.", href: "/blog/las-vegas-luxury-seller-net-proceeds" },
            { title: "Market Report", desc: "Where prices and inventory stand now.", href: "/market-report" },
          ].map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="block rounded-[12px] border border-[var(--color-line)] bg-white p-6 no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
            >
              <h3 className="text-[1.05rem]">{r.title}</h3>
              <p className="mt-2 text-[0.88rem] text-[var(--color-ink-soft)]">{r.desc}</p>
              <span className="mt-3 inline-block font-sans text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-gold)]">
                Read →
              </span>
            </Link>
          ))}
        </div>
      </Container>

      {/* FAQ */}
      <Container size="narrow" className="prose-body py-8">
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

      {/* Final CTA */}
      <section className="bg-[var(--color-graphite)] text-white">
        <Container size="wide" className="py-16 text-center">
          <div className="mx-auto max-w-[620px]">
            <h2 className="font-serif text-[2.2rem] font-semibold text-white">Ready to sell your home?</h2>
            <p className="mx-auto mt-3 max-w-[500px] text-[1.05rem] text-[#cfd3da]">
              Get your instant home value, or call for a free, no-pressure consultation. We&apos;ll show you exactly
              what we&apos;d do to sell your home for top dollar.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-4">
              <Link href="/home-value" className="btn">Get my home value</Link>
              <a href={`tel:${site.phone}`} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Call {site.phone}
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
