import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { PreApprovalForm } from "@/components/PreApprovalForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mortgage Pre-Approval Request | Las Vegas Home Buyers",
  description:
    "Get pre-approved before you shop for a Las Vegas or Henderson home. Request a fast, no-obligation mortgage pre-approval and know exactly what you can afford.",
  alternates: { canonical: "/mortgage-pre-approval" },
};

const benefits = [
  {
    h: "Know your true budget",
    p: "A pre-approval tells you the price range you actually qualify for — so you shop with confidence instead of guesswork.",
  },
  {
    h: "Win in a competitive offer",
    p: "Sellers take pre-approved buyers seriously. A verified letter makes your offer stronger than a shopper who hasn't talked to a lender.",
  },
  {
    h: "Close faster",
    p: "With your financials reviewed up front, the path from accepted offer to keys in hand is shorter and far less stressful.",
  },
];

const steps = [
  {
    n: "1",
    h: "Request pre-approval",
    p: "Complete the short form and we'll connect you with a trusted local lender — no cost, no obligation.",
  },
  {
    n: "2",
    h: "Share your details",
    p: "The lender reviews your income, assets, and credit to determine the loan amount and program that fit you.",
  },
  {
    n: "3",
    h: "Get your letter",
    p: "Receive a pre-approval letter that shows sellers you're a serious, qualified buyer ready to make an offer.",
  },
  {
    n: "4",
    h: "Start shopping",
    p: "With your budget confirmed, we'll help you find and win the right home across Las Vegas and Henderson.",
  },
];

const faqs = [
  {
    q: "What is a mortgage pre-approval?",
    a: "A mortgage pre-approval is a lender's written estimate of how much you can borrow, based on a review of your income, assets, debts, and credit. It's a stronger signal than a pre-qualification because it relies on verified financial information, and it tells you — and sellers — the price range you can confidently shop in.",
  },
  {
    q: "Is getting pre-approved free?",
    a: "Yes. Requesting a pre-approval through Roland Luxury is free and comes with no obligation to use a particular lender or to buy a home. We simply connect you with a trusted local lender so you can shop with clarity.",
  },
  {
    q: "How long does pre-approval take?",
    a: "Once you share your information with the lender, a pre-approval can often be issued within one to three business days — sometimes the same day. Having recent pay stubs, tax returns, and bank statements ready speeds things up.",
  },
  {
    q: "What documents do I need to get pre-approved?",
    a: "Lenders typically ask for recent pay stubs, W-2s or tax returns, bank and asset statements, and authorization to check your credit. Self-employed buyers may need additional documentation such as profit-and-loss statements. Your lender will provide an exact checklist.",
  },
  {
    q: "Does pre-approval hurt my credit score?",
    a: "A pre-approval involves a credit check, which is a hard inquiry that may lower your score by a few points temporarily. Multiple mortgage inquiries within a short shopping window are generally treated as a single inquiry, so comparing lenders won't disproportionately affect your score.",
  },
  {
    q: "How long is a pre-approval good for?",
    a: "Most pre-approval letters are valid for 60 to 90 days. If your home search runs longer, the lender can refresh your letter with updated documentation. It's a good idea to keep your finances steady — avoid new large debts — until you close.",
  },
];

export default function MortgagePreApprovalPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Buy a Home", path: "/buy" },
            { name: "Mortgage Pre-Approval", path: "/mortgage-pre-approval" },
          ]),
          faqSchema(faqs),
        ]}
      />

      <section id="request" className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.newConstruction} priority />
        <Container size="wide" className="relative z-10 grid gap-10 py-16 md:grid-cols-2 md:py-20">
          <div className="max-w-[520px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Buyers
            </div>
            <h1 className="mt-3 font-serif text-[2.8rem] font-semibold leading-[1.05] text-white md:text-[3.4rem]">
              Get pre-approved before you shop
            </h1>
            <p className="mt-5 text-[1.12rem] text-[#d9dbe0]">
              Know exactly what you can afford and make offers sellers take seriously. Request a fast,
              no-obligation mortgage pre-approval from a trusted Las Vegas lender — then let us help you find
              the right home.
            </p>
            <ul className="mt-6 space-y-2 font-sans text-[0.95rem] text-[#d9dbe0]">
              <li>✓ Free and no obligation — no impact on your credit to ask</li>
              <li>✓ Matched with a trusted local, licensed lender</li>
              <li>✓ Most buyers have their letter in 24–48 hours</li>
            </ul>
          </div>

          {/* Pre-approval request form → Follow Up Boss */}
          <div className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
            <div className="mb-1 font-sans text-[1.1rem] font-semibold">Request your pre-approval</div>
            <p className="mb-5 font-sans text-[0.85rem] text-[var(--color-ink-soft)]">
              Tell us a bit about your plans and we&apos;ll match you with the right lender.
            </p>
            <PreApprovalForm />
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-16">
        <div className="eyebrow">Why it matters</div>
        <h2 className="mt-2 text-[1.9rem]">Why get pre-approved first?</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {benefits.map((c) => (
            <div key={c.h} className="rounded-[12px] border border-[var(--color-line)] bg-white p-7">
              <h3 className="text-[1.2rem]">{c.h}</h3>
              <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{c.p}</p>
            </div>
          ))}
        </div>
      </Container>

      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-16">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-2 text-[1.9rem]">Pre-approval in four simple steps</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-[12px] border border-[var(--color-line)] bg-white p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-graphite)] font-sans text-[1.05rem] font-semibold text-[var(--color-gold-2)]">
                  {s.n}
                </div>
                <h3 className="mt-4 text-[1.15rem]">{s.h}</h3>
                <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{s.p}</p>
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
          <h2 className="text-[1.7rem] text-white">Ready to know your buying power?</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Get pre-approved and shop with confidence — or call {site.phone} to talk it through with our team.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="#request" className="btn">Request Pre-Approval</Link>
            <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
              {site.cta.label}
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
