import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Down Payment Assistance in Las Vegas | The Roland Team",
  description:
    "The down payment is the #1 hurdle for Las Vegas buyers — and you may not need as much as you think. See if you qualify for down payment assistance and grant programs.",
  alternates: { canonical: "/down-payment-assistance" },
};

const benefits = [
  {
    h: "Lower your upfront cost",
    p: "Assistance and grant programs can reduce — or in some cases cover — the cash you need at closing, so a home is within reach sooner.",
  },
  {
    h: "Keep your savings intact",
    p: "Put less of your own money down and hold onto a healthy cushion for moving, furnishing, and life after closing.",
  },
  {
    h: "Buy sooner than you think",
    p: "Many buyers assume they need 20% down. Between assistance programs and low-down-payment loans, the real number is often far less.",
  },
];

const steps = [
  { n: "1", h: "Tell us about your goals", p: "Complete the short form — no cost, no obligation, and no impact on your credit to ask." },
  { n: "2", h: "Get matched with a lender", p: "We connect you with a trusted local lender who knows the current assistance and grant programs inside out." },
  { n: "3", h: "See what you qualify for", p: "The lender reviews your situation and lays out the programs and loan options you're eligible for — in plain English." },
  { n: "4", h: "Shop with confidence", p: "With your true down payment and budget confirmed, we'll help you find and win the right home across the valley." },
];

const faqs = [
  {
    q: "What is down payment assistance?",
    a: "Down payment assistance (DPA) is help — often in the form of a grant or a second loan — that reduces the cash a buyer needs at closing. Nevada offers several programs aimed at making homeownership more attainable, and there are also low-down-payment loan options (like FHA and VA) that work alongside them. Programs, amounts, and eligibility change over time, so the best first step is a quick conversation with a lender who works with them every day.",
  },
  {
    q: "How much assistance could I get?",
    a: "It varies by program, your income, the home's price, and your loan type — so there's no single number. Rather than quote a figure that may be out of date, we'll match you with a lender who will tell you exactly what's available to you right now. Requesting that review is free.",
  },
  {
    q: "Does the assistance have to be paid back?",
    a: "It depends on the program. Some assistance is structured as a grant that doesn't need to be repaid; other programs are a second loan that's repaid, deferred, or even forgiven over time if you stay in the home. Your lender will explain the exact terms of any program you qualify for before you commit to anything.",
  },
  {
    q: "Do I have to be a first-time buyer to qualify?",
    a: "Not necessarily. Some programs are reserved for first-time buyers (often defined as not having owned a home in the past three years), but others are open to repeat buyers who meet income and property guidelines. We'll help you find the programs that fit your situation.",
  },
  {
    q: "Can I combine assistance with an FHA or VA loan?",
    a: "Often, yes. Down payment assistance is frequently paired with FHA loans, and veterans and active-duty military may qualify for zero-down VA financing that can reduce the need for assistance altogether. A lender will help you structure the combination that costs you the least out of pocket.",
  },
  {
    q: "Will checking my options affect my credit?",
    a: "Simply requesting information and talking through your options does not affect your credit. A lender will only run a credit check when you're ready to move toward a pre-approval, and they'll ask first.",
  },
];

export default function DownPaymentAssistancePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Buy a Home", path: "/buy" },
            { name: "Down Payment Assistance", path: "/down-payment-assistance" },
          ]),
          faqSchema(faqs),
        ]}
      />

      <section id="request" className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.henderson} priority />
        <Container size="wide" className="relative z-10 grid gap-10 py-16 md:grid-cols-2 md:py-20">
          <div className="max-w-[520px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Buyers
            </div>
            <h1 className="mt-3 font-serif text-[2.8rem] font-semibold leading-[1.05] text-white md:text-[3.4rem]">
              You may need less down than you think
            </h1>
            <p className="mt-5 text-[1.12rem] text-[#d9dbe0]">
              The down payment is the biggest hurdle most buyers face — and it&apos;s often smaller than they expect.
              See if you qualify for down payment assistance and grant programs across Las Vegas and Henderson.
            </p>
            <ul className="mt-6 space-y-2 font-sans text-[0.95rem] text-[#d9dbe0]">
              <li>✓ Free and no obligation — no credit impact to ask</li>
              <li>✓ Matched with a trusted local lender</li>
              <li>✓ Grants, assistance programs, and low-down loans</li>
            </ul>
          </div>

          {/* Down payment assistance inquiry → Follow Up Boss */}
          <div className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
            <div className="mb-1 font-sans text-[1.1rem] font-semibold">See if you qualify</div>
            <p className="mb-5 font-sans text-[0.85rem] text-[var(--color-ink-soft)]">
              Tell us a bit about your plans and we&apos;ll match you with the right lender.
            </p>
            <LeadForm
              type="Buyer Inquiry"
              tags={["Buyer Lead", "Down Payment Assistance"]}
              source="Down Payment Assistance Request"
              submitLabel="See If I Qualify"
            />
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-16">
        <div className="eyebrow">Why it matters</div>
        <h2 className="mt-2 text-[1.9rem]">Help with the hardest part of buying</h2>
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
          <h2 className="mt-2 text-[1.9rem]">From question to keys in four steps</h2>
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
          <h2 className="text-[1.7rem] text-white">Find out what you qualify for</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            It&apos;s free, there&apos;s no obligation, and it could put a home within reach sooner than you think — or
            call {site.phone} to talk it through.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="#request" className="btn">See If I Qualify</Link>
            <Link href="/mortgage-pre-approval" className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
              Get Pre-Approved
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
