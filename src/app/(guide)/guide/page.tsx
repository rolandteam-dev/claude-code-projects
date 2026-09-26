import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import {
  guideContact,
  guideStats,
  localsSections,
  relocationGuides,
  starterKitChapters,
} from "@/content/relocationGuides";
import { GuideCover } from "@/components/guide/GuideCover";
import { GuideForm } from "@/components/guide/GuideForm";
import { Eyebrow, GuideFooter, GuideTopBar } from "@/components/guide/GuideChrome";

/**
 * guide.therolandteam.com — the page linked from every YouTube description
 * and pinned comment. One offer (two free guides), one form, no navigation.
 * Every section is one idea with room around it.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const [starterKit, locals] = relocationGuides;

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

export default function GuidePage() {
  return (
    <div id="top" className="flex min-h-full flex-1 flex-col">
      <GuideTopBar />

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-[1312px] flex-col items-center px-5 pt-11 text-center md:px-8 md:pt-28">
        <Eyebrow>Two free guides · Las Vegas &amp; Henderson</Eyebrow>
        <h1 className="mt-[18px] max-w-[1040px] font-serif text-[52px] font-medium leading-[0.98] tracking-[-0.015em] md:mt-7 md:text-[84px] md:leading-[1] lg:text-[104px]">
          Moving to Las Vegas? Start here.
        </h1>
        <p className="mt-[18px] max-w-[800px] font-sans text-[17px] leading-[1.5] text-muted-2 md:mt-7 md:text-[23px]">
          Part one is what the move actually costs and the deadlines that catch people. Part two is the city
          you&apos;ll live in once the boxes are unpacked, with zero Strip recommendations. Written by a team that
          does this every week.
        </p>

        {/* The two guides, on a stage. On phones the form comes first. */}
        <div className="mt-6 flex h-[300px] w-full items-center justify-center overflow-hidden rounded-[28px] bg-sand md:order-2 md:mt-[72px] md:h-[620px] md:max-w-[1280px] md:rounded-[40px]">
          <div className="flex items-center justify-center text-[5.2px] md:text-[10px]">
            <GuideCover
              guide={starterKit}
              className="z-[1] -rotate-[5deg] shadow-[0_20px_36px_rgba(20,22,27,0.30)] md:shadow-[0_40px_70px_rgba(20,22,27,0.30)]"
            />
            <GuideCover
              guide={locals}
              className="-ml-[3.6em] translate-y-[2.8em] rotate-[5deg] shadow-[0_20px_36px_rgba(20,22,27,0.20)] md:shadow-[0_40px_70px_rgba(20,22,27,0.22)]"
            />
          </div>
        </div>

        <div className="mt-6 flex w-full justify-center md:order-1 md:mt-12">
          <Suspense fallback={null}>
            <GuideForm />
          </Suspense>
        </div>
      </section>

      {/* Part one: what's inside */}
      <section className="mx-auto w-full max-w-[1312px] px-5 pt-[88px] md:px-8 md:pt-[136px]">
        <div className="flex flex-col gap-3.5 md:items-center md:gap-[18px] md:text-center">
          <Eyebrow>Part one</Eyebrow>
          <h2 className="font-serif text-[40px] font-medium leading-[1.04] tracking-[-0.012em] md:text-[68px]">
            Everything the listing photos leave out.
          </h2>
          <p className="max-w-[720px] font-sans text-[17px] leading-[1.5] text-muted-2 md:text-[20px]">
            Six short chapters. Read the one you need today and keep the rest for later.
          </p>
        </div>
        <div className="mt-7 grid grid-cols-1 gap-3.5 md:mt-12 md:grid-cols-3 md:gap-6">
          {starterKitChapters.map((c) => (
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

      {/* Part two: the dark section */}
      <section className="mt-[88px] bg-graphite text-sand md:mt-[136px]">
        <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-[18px] px-5 py-[72px] md:flex-row md:items-center md:gap-[72px] md:px-8 md:py-32">
          <div className="flex flex-col gap-[18px] md:max-w-[700px] md:flex-1 md:gap-7">
            <Eyebrow dark>Part two</Eyebrow>
            <h2 className="font-serif text-[44px] font-medium leading-[1.02] tracking-[-0.012em] text-sand md:text-[68px] md:leading-[1.04]">
              The Locals&apos; Las Vegas
            </h2>
            <p className="font-sans text-[17px] leading-[1.5] text-ivory-2 md:text-[21px]">
              The city you&apos;ll actually live in once the boxes are unpacked. Not one Strip recommendation in it.
            </p>
            <div className="mt-2 grid grid-cols-1 gap-[18px] md:mt-3 md:grid-cols-2 md:gap-x-10 md:gap-y-7">
              {localsSections.map((s) => (
                <div key={s.title} className="flex flex-col gap-1.5 border-t border-gold-2/45 pt-3 md:gap-2 md:pt-4">
                  <h3 className="font-sans text-[17px] font-semibold md:text-[18px]">{s.title}</h3>
                  <p className="font-sans text-[14px] leading-[1.5] text-ivory-2 md:text-[15px]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden h-[560px] w-[460px] shrink-0 items-center justify-center rounded-[36px] bg-graphite-2 md:flex">
            <div className="text-[8.8px]">
              <GuideCover guide={locals} className="rotate-[4deg] shadow-[0_40px_70px_rgba(0,0,0,0.45)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="mx-auto w-full max-w-[1312px] px-5 pt-[72px] md:px-8 md:pt-28">
        <h2 className="font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.01em] md:mx-auto md:max-w-[900px] md:text-center md:text-[52px]">
          Written by a team that helps people make this exact move every week.
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-3 md:mx-auto md:mt-11 md:max-w-[1200px] md:grid-cols-4 md:gap-6">
          {guideStats.map((s) => (
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
              &ldquo;If you&apos;re seriously looking at this move, this is what I&apos;d want you to know before you
              sign anything. My number&apos;s in the guide. Call or text, we answer.&rdquo;
            </blockquote>
            <div className="flex flex-col gap-1">
              <div className="font-sans text-[16px] font-semibold md:text-[17px]">Mike Roland</div>
              <div className="font-sans text-[14px] leading-[1.4] text-muted-2 md:text-[15px]">
                The Roland Team with LPT Realty · Las Vegas and Henderson, Nevada
              </div>
            </div>
            <a
              href={guideContact.phoneHref}
              className="inline-flex h-[46px] items-center gap-2.5 self-start rounded-full border border-ink px-5 font-sans text-[15px] font-semibold text-ink no-underline transition hover:bg-white md:h-12 md:px-[22px]"
            >
              <PhoneIcon />
              <span>{guideContact.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto flex w-full max-w-[1312px] flex-col gap-4 px-5 pb-16 pt-20 md:items-center md:gap-6 md:px-8 md:pb-24 md:pt-32 md:text-center">
        <h2 className="font-serif text-[40px] font-medium leading-[1.04] tracking-[-0.012em] md:max-w-[900px] md:text-[64px] md:leading-[1.06]">
          Both guides. Free. Yours in about ten seconds.
        </h2>
        <p className="font-sans text-[16px] text-muted-2 md:text-[19px]">One form, no waiting for an email.</p>
        <a
          href="#guide-form"
          className="mt-1.5 inline-flex h-[54px] items-center gap-2.5 self-start rounded-full bg-ink px-[26px] font-sans text-[16px] font-semibold text-white no-underline transition hover:bg-graphite-2 md:mt-2 md:h-[60px] md:self-auto md:px-[34px] md:text-[17px]"
        >
          <span>Get both guides</span>
          <ArrowIcon />
        </a>
      </section>

      <GuideFooter />
    </div>
  );
}
