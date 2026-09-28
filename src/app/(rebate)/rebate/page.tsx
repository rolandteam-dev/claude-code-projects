import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import {
  formatUsd,
  howItWorks,
  rebateContact,
  rebateExamples,
  rebateFaqs,
  rebateOffer,
  rebateStats,
  whatWeDo,
} from "@/content/newConstructionRebate";
import { RebateForm } from "@/components/rebate/RebateForm";
import { RebateFooter, RebateTopBar } from "@/components/rebate/RebateChrome";
import { Eyebrow } from "@/components/guide/GuideChrome";

/**
 * rebate.therolandteam.com. The page linked from the new-construction video.
 * One offer (1% of base price back at closing), one form, no navigation. The
 * argument runs top to bottom: the builder pays either way, register first,
 * here is the math, here is what we do for the part we keep, here are the
 * questions people ask, here are the terms.
 *
 * Links inside the page use "/rebate/..." so they work on every host; the
 * rebate host serves those long paths too, next to the short "/terms".
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.9 2z" />
    </svg>
  );
}

export default function RebatePage() {
  return (
    <div id="top" className="flex min-h-full flex-1 flex-col">
      <RebateTopBar base="/rebate" />

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-[1312px] flex-col items-center px-5 pt-11 text-center md:px-8 md:pt-28">
        <Eyebrow>New construction · Las Vegas &amp; Henderson</Eyebrow>
        <h1 className="mt-[18px] max-w-[1040px] font-serif text-[52px] font-medium leading-[0.98] tracking-[-0.015em] md:mt-7 md:text-[84px] md:leading-[1] lg:text-[104px]">
          Buying new construction? Get {rebateOffer.pricePercent}% back at closing.
        </h1>
        <p className="mt-[18px] max-w-[820px] font-sans text-[17px] leading-[1.5] text-muted-2 md:mt-7 md:text-[23px]">
          The builder pays our commission whether you bring an agent or not. Register with us before your first
          visit and we credit you {rebateOffer.pricePercent}% of the base purchase price at closing, up to half of
          what the builder pays us. Written into your buyer agreement, paid by LPT Realty.
        </p>

        <div className="mt-6 flex w-full justify-center md:mt-12">
          <Suspense fallback={null}>
            <RebateForm />
          </Suspense>
        </div>

        {/* The math, on a stage. */}
        <div className="mt-6 w-full max-w-[1280px] rounded-[28px] bg-sand px-5 py-8 md:mt-12 md:rounded-[40px] md:px-16 md:py-14">
          <div className="flex flex-col gap-2 md:items-center">
            <Eyebrow>What it comes to</Eyebrow>
            <p className="font-sans text-[15px] text-muted-2 md:text-[17px]">
              {rebateOffer.pricePercent}% of the base price, whenever the builder pays 2% or more.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 md:mt-9 md:grid-cols-3 md:gap-6">
            {rebateExamples.map((ex) => (
              <div
                key={ex.basePrice}
                className="flex flex-col items-center gap-1.5 rounded-[22px] bg-white px-5 py-6 md:gap-2 md:rounded-[28px] md:py-9"
              >
                <div className="font-sans text-[13px] tracking-[0.04em] text-muted-2 md:text-[14px]">
                  {formatUsd(ex.basePrice)} base price
                </div>
                <div className="font-serif text-[44px] leading-none text-ink md:text-[60px]">{formatUsd(ex.credit)}</div>
                <div className="font-sans text-[13px] text-gold-deep md:text-[14px]">credit at closing</div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center font-sans text-[13px] leading-[1.5] text-muted-2 md:mt-7 md:text-[14px]">
            If a builder pays us less than 2%, the rebate is half of what we receive. It is funded by the builder&apos;s
            commission, never by your price. Full terms below.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-[1312px] px-5 pt-[88px] md:px-8 md:pt-[136px]">
        <div className="flex flex-col gap-3.5 md:items-center md:gap-[18px] md:text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-serif text-[40px] font-medium leading-[1.04] tracking-[-0.012em] md:text-[68px]">
            Three steps. The second one is the whole thing.
          </h2>
          <p className="max-w-[720px] font-sans text-[17px] leading-[1.5] text-muted-2 md:text-[20px]">
            Builders budget a commission for the buyer&apos;s agent. Walk in without one and they keep it.
          </p>
        </div>
        <div className="mt-7 grid grid-cols-1 gap-3.5 md:mt-12 md:grid-cols-3 md:gap-6">
          {howItWorks.map((c) => (
            <div
              key={c.n}
              className="flex flex-col gap-2.5 rounded-[22px] bg-sand p-6 md:min-h-[250px] md:gap-4 md:rounded-[28px] md:p-9"
            >
              <div className="font-serif text-[40px] leading-none text-gold-deep md:text-[54px]">{c.n}</div>
              <h3 className="font-sans text-[19px] font-semibold tracking-[-0.01em] md:text-[21px]">{c.title}</h3>
              <p className="font-sans text-[15px] leading-[1.55] text-muted-2 md:text-[16px]">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we do: the dark section */}
      <section className="mt-[88px] bg-graphite text-sand md:mt-[136px]">
        <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-[18px] px-5 py-[72px] md:px-8 md:py-32">
          <div className="flex flex-col gap-[18px] md:max-w-[820px] md:gap-7">
            <Eyebrow dark>What the rest of the fee pays for</Eyebrow>
            <h2 className="font-serif text-[44px] font-medium leading-[1.02] tracking-[-0.012em] text-sand md:text-[68px] md:leading-[1.04]">
              The builder&apos;s sales agent works for the builder.
            </h2>
            <p className="font-sans text-[17px] leading-[1.5] text-ivory-2 md:text-[21px]">
              A new build has more moving parts than a resale, and every one of them is on the builder&apos;s paper.
              Here is what we do with the half we keep.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-[18px] md:mt-8 md:grid-cols-3 md:gap-x-10 md:gap-y-9">
            {whatWeDo.map((s) => (
              <div key={s.title} className="flex flex-col gap-1.5 border-t border-gold-2/45 pt-3 md:gap-2 md:pt-4">
                <h3 className="font-sans text-[17px] font-semibold md:text-[18px]">{s.title}</h3>
                <p className="font-sans text-[14px] leading-[1.5] text-ivory-2 md:text-[15px]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="mx-auto w-full max-w-[1312px] px-5 pt-[72px] md:px-8 md:pt-28">
        <h2 className="font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.01em] md:mx-auto md:max-w-[900px] md:text-center md:text-[52px]">
          A team that closes new construction in this valley every month.
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-3 md:mx-auto md:mt-11 md:max-w-[1200px] md:grid-cols-4 md:gap-6">
          {rebateStats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-1.5 border-t border-line pb-2 pt-[18px] md:items-center md:gap-2 md:py-7"
            >
              <div className="font-serif text-[40px] leading-none md:text-[56px]">{s.value}</div>
              <div className="font-sans text-[13px] text-muted-2 md:text-[14px] md:tracking-[0.04em]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mike */}
      <section className="mx-auto w-full max-w-[1312px] px-5 pt-16 md:px-8 md:pt-28">
        <div className="flex flex-col gap-5 rounded-[28px] bg-sand p-6 md:flex-row md:items-center md:gap-16 md:rounded-[40px] md:p-[72px]">
          <Image
            src="/guides/mike-roland.jpg"
            alt="Mike Roland"
            width={1200}
            height={1881}
            sizes="(min-width: 768px) 380px, 100vw"
            className="h-[340px] w-full rounded-[20px] object-cover object-top md:h-[480px] md:w-[380px] md:shrink-0 md:rounded-[28px]"
          />
          <div className="flex flex-col gap-5 md:gap-7">
            <blockquote className="m-0 font-serif text-[27px] font-medium leading-[1.2] tracking-[-0.01em] md:text-[42px]">
              &ldquo;The builder is going to pay a buyer&apos;s agent on your home either way. The only question is
              whether some of it comes back to you. Call before you visit a sales office and it will.&rdquo;
            </blockquote>
            <div className="flex flex-col gap-1">
              <div className="font-sans text-[16px] font-semibold md:text-[17px]">Mike Roland</div>
              <div className="font-sans text-[14px] leading-[1.4] text-muted-2 md:text-[15px]">
                The Roland Team with LPT Realty · Las Vegas and Henderson, Nevada
              </div>
            </div>
            <a
              href={rebateContact.phoneHref}
              className="inline-flex h-[46px] items-center gap-2.5 self-start rounded-full border border-ink px-5 font-sans text-[15px] font-semibold text-ink no-underline transition hover:bg-white md:h-12 md:px-[22px]"
            >
              <PhoneIcon />
              <span>{rebateContact.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-[1312px] px-5 pt-[72px] md:px-8 md:pt-28">
        <div className="flex flex-col gap-3.5 md:items-center md:gap-[18px] md:text-center">
          <Eyebrow>Questions people ask</Eyebrow>
          <h2 className="font-serif text-[40px] font-medium leading-[1.04] tracking-[-0.012em] md:text-[60px]">
            The fine print, in plain English.
          </h2>
        </div>
        <div className="mx-auto mt-7 flex max-w-[900px] flex-col md:mt-12">
          {rebateFaqs.map((f) => (
            <details key={f.q} className="group border-t border-line py-5 md:py-6 last:border-b">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-sans text-[18px] font-semibold tracking-[-0.01em] md:text-[21px] [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 font-serif text-[28px] leading-none text-gold-deep transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[780px] font-sans text-[15.5px] leading-[1.6] text-muted-2 md:text-[17px]">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-[900px] font-sans text-[14px] text-muted-2 md:text-center md:text-[15px]">
          Everything above is summarized from the{" "}
          <a href="/rebate/terms" className="text-gold-deep underline underline-offset-4">
            full program terms
          </a>
          , which are also restated in your buyer agreement.
        </p>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto flex w-full max-w-[1312px] flex-col gap-4 px-5 pb-16 pt-20 md:items-center md:gap-6 md:px-8 md:pb-24 md:pt-32 md:text-center">
        <h2 className="font-serif text-[40px] font-medium leading-[1.04] tracking-[-0.012em] md:max-w-[900px] md:text-[64px] md:leading-[1.06]">
          Register first. Visit second. Keep {rebateOffer.pricePercent}%.
        </h2>
        <p className="font-sans text-[16px] text-muted-2 md:text-[19px]">
          One form, one short call, and you are on record with every builder on your list.
        </p>
        <a
          href="#rebate-form"
          className="mt-1.5 inline-flex h-[54px] items-center gap-2.5 self-start rounded-full bg-ink px-[26px] font-sans text-[16px] font-semibold text-white no-underline transition hover:bg-graphite-2 md:mt-2 md:h-[60px] md:self-auto md:px-[34px] md:text-[17px]"
        >
          <span>Claim my rebate</span>
          <ArrowIcon />
        </a>
      </section>

      <RebateFooter base="/rebate" />
    </div>
  );
}
