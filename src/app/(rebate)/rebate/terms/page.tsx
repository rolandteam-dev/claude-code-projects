import type { Metadata } from "next";
import { rebateOffer, rebateTerms } from "@/content/newConstructionRebate";
import { RebateFooter, RebateTopBar } from "@/components/rebate/RebateChrome";
import { Eyebrow } from "@/components/guide/GuideChrome";

/**
 * The program terms, linked from the video description, the landing page,
 * the thank-you page and the confirmation email. The same terms are restated
 * in an addendum to the buyer agreement, which is what actually binds; this
 * page is the public disclosure of the offer.
 */
export const metadata: Metadata = {
  title: "New Construction Rebate: Program Terms",
  description: `Terms of ${rebateOffer.programName}: ${rebateOffer.pricePercent}% of the base purchase price credited at closing, capped at ${rebateOffer.commissionCapPercent}% of the commission the builder pays LPT Realty.`,
  alternates: { canonical: "/terms" },
};

export default function RebateTermsPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <RebateTopBar cta={false} base="/rebate" />

      <article className="mx-auto w-full max-w-[820px] px-5 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20">
        <Eyebrow>Program terms</Eyebrow>
        <h1 className="mt-4 font-serif text-[42px] font-medium leading-[1.02] tracking-[-0.012em] md:mt-6 md:text-[64px]">
          {rebateOffer.programName}
        </h1>
        <p className="mt-4 font-sans text-[15px] text-muted-2 md:text-[16px]">
          Terms version: {rebateOffer.termsVersion}
        </p>

        <div className="mt-8 rounded-[20px] bg-sand p-6 md:mt-10 md:rounded-[24px] md:p-8">
          <p className="font-sans text-[16px] leading-[1.6] md:text-[18px]">
            <strong>In one sentence:</strong> buy a new home through The Roland Team, register with us before your
            first builder visit, and LPT Realty credits you {rebateOffer.pricePercent}% of the base purchase price at
            closing, up to {rebateOffer.commissionCapPercent}% of the commission the builder pays us.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-9 md:mt-14 md:gap-11">
          {rebateTerms.map((section) => (
            <section key={section.heading} className="flex flex-col gap-3.5">
              <h2 className="font-sans text-[20px] font-semibold tracking-[-0.01em] md:text-[22px]">{section.heading}</h2>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="font-sans text-[15.5px] leading-[1.7] text-ink-soft md:text-[16.5px]">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-line pt-8">
          <a
            href="/rebate#rebate-form"
            className="inline-flex h-12 items-center rounded-full bg-ink px-[22px] font-sans text-[15px] font-semibold text-white no-underline transition hover:bg-graphite-2"
          >
            Claim the rebate
          </a>
        </div>
      </article>

      <RebateFooter base="/rebate" />
    </div>
  );
}
