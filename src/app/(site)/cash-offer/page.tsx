import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { CashOfferForm } from "@/components/CashOfferForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cash Offer for Your Las Vegas Home | Sell Fast, No Obligation",
  description:
    "Get a no-obligation cash offer on your Las Vegas or Henderson home — and see it side-by-side with what you'd net on the open market, so you choose with clarity.",
  alternates: { canonical: "/cash-offer" },
};

const doors = [
  {
    h: "Sell for cash",
    p: "Skip showings and repairs. We bring you vetted cash-offer options for a fast, certain close on your timeline — you pick the date.",
  },
  {
    h: "List on the market",
    p: "Often nets more. We show you what your home could bring listed, with our full marketing behind it, so you can compare apples to apples.",
  },
  {
    h: "Decide with the numbers",
    p: "No pressure and no obligation. You see both paths — cash vs. open market — in writing, and choose what fits your goals.",
  },
];

const faqs = [
  {
    q: "How does a cash offer work?",
    a: "You tell us about your home, we review it and bring you vetted cash-offer options — typically a fast, as-is close with no showings or repairs. There's no obligation to accept; it's simply one path to compare.",
  },
  {
    q: "Will a cash offer be less than listing on the market?",
    a: "Often, yes — cash offers trade a bit of price for speed and certainty. That's exactly why we show you both: your cash-offer options and an estimate of what the same home could net listed, so the trade-off is clear before you decide.",
  },
  {
    q: "How fast can I close with a cash offer?",
    a: "Cash sales can often close in as little as one to three weeks because there's no financing contingency, though the exact timeline depends on the buyer and title. You choose a closing date that works for you.",
  },
  {
    q: "Is there any cost or obligation to get a cash offer?",
    a: "No. Requesting your options is free and comes with zero obligation. If the numbers don't work for you, there's no pressure to move forward.",
  },
  {
    q: "What kinds of homes qualify?",
    a: "Cash-offer programs work for a wide range of Las Vegas and Henderson homes and conditions — including homes that need work. Share a few details and we'll let you know your options.",
  },
];

export default function CashOfferPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Sell", path: "/sell" },
            { name: "Cash Offer", path: "/cash-offer" },
          ]),
          faqSchema(faqs),
        ]}
      />

      <section id="request" className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.estate} priority />
        <Container size="wide" className="relative z-10 grid items-center gap-10 py-16 md:grid-cols-2 md:py-20">
          <div className="max-w-[540px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Sellers
            </div>
            <h1 className="mt-3 font-serif text-[2.9rem] font-semibold leading-[1.03] text-white md:text-[3.5rem]">
              Get a cash offer on your home
            </h1>
            <p className="mt-5 text-[1.12rem] text-[#d9dbe0]">
              A fast, certain sale — no showings, no repairs, close on your timeline. And because {site.founder.split(" ")[0]}
              &apos;s team also shows you what your home could net on the open market, you decide with the full picture.
            </p>
            <ul className="mt-6 space-y-2 font-sans text-[0.95rem] text-[#d9dbe0]">
              <li>✓ No obligation — compare and decide</li>
              <li>✓ Sell as-is, skip repairs and showings</li>
              <li>✓ Cash vs. market, side by side</li>
            </ul>
          </div>
          <CashOfferForm />
        </Container>
      </section>

      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-16">
          <div className="eyebrow">Your options</div>
          <h2 className="mt-2 text-[1.9rem]">Two ways to sell — one clear decision</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {doors.map((d) => (
              <div key={d.h} className="rounded-[12px] border border-[var(--color-line)] bg-white p-7">
                <h3 className="text-[1.2rem]">{d.h}</h3>
                <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{d.p}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Container size="narrow" className="prose-body py-14">
        <h2 className="mt-4 text-[1.6rem]">Frequently asked questions</h2>
        <div className="mt-2">
          {faqs.map((f) => (
            <details key={f.q} className="border-b border-[var(--color-line)] py-4">
              <summary className="cursor-pointer font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">
                {f.q}
              </summary>
              <p className="mt-3">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.7rem] text-white">See your cash offer and your market number</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Free, no-obligation, and no pressure — just the numbers you need to choose the right path.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a href="#request" className="btn">Get My Cash Offer</a>
            <a href={`tel:${site.phone}`} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
              Call {site.phone}
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
