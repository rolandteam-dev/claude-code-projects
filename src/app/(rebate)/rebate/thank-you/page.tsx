import type { Metadata } from "next";
import { rebateContact, rebateOffer } from "@/content/newConstructionRebate";
import { RebateFooter, RebateTopBar } from "@/components/rebate/RebateChrome";
import { Eyebrow } from "@/components/guide/GuideChrome";

/**
 * Where the rebate form lands. One ask: book the call, because the buyer
 * agreement has to be signed and the builder registration done before the
 * buyer's first visit. Not indexed: it is the reward for filling in the form.
 */
export const metadata: Metadata = {
  title: "You're registered for the rebate",
  robots: { index: false, follow: false },
};

/** Only a plain first name is greeted; anything odd in the URL is ignored. */
function cleanFirstName(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  return /^[A-Za-z][A-Za-z' -]{0,29}$/.test(v) ? v : "";
}

const nextSteps = [
  {
    n: "01",
    title: "Book the call",
    body: "Fifteen to thirty minutes on Zoom. Bring the builders and communities on your list, and any questions.",
  },
  {
    n: "02",
    title: "Sign the buyer agreement",
    body: "Sent electronically after the call. It states the rebate in writing, so nothing depends on a web page.",
  },
  {
    n: "03",
    title: "We register you",
    body: "With every builder on your list, before your first visit. Then go tour as much as you like.",
  },
];

export default async function RebateThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const { first } = await searchParams;
  const name = cleanFirstName(first);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <RebateTopBar cta={false} base="/rebate" />

      <section className="mx-auto flex w-full max-w-[1312px] flex-col gap-4 px-5 pt-12 md:items-center md:gap-[22px] md:px-8 md:pt-[88px] md:text-center">
        <div className="flex items-center gap-2.5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-gold-deep"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <Eyebrow>You&apos;re in</Eyebrow>
        </div>
        <h1 className="font-serif text-[48px] font-medium leading-[0.98] tracking-[-0.015em] md:text-[84px] md:leading-[1]">
          {name ? `${name}, your rebate is saved.` : "Your rebate is saved."}
        </h1>
        <p className="max-w-[760px] font-sans text-[17px] leading-[1.5] text-muted-2 md:text-[21px]">
          {rebateOffer.pricePercent}% of the base price back at closing, up to half of what the builder pays us. One
          short call makes it official. We also sent the details to your email.
        </p>
      </section>

      {/* The one warning that matters. */}
      <section className="mx-auto mt-8 w-full max-w-[1312px] px-5 md:mt-12 md:px-8">
        <div className="mx-auto flex max-w-[980px] flex-col gap-2 rounded-[22px] border border-gold-2/60 bg-ivory p-6 md:rounded-[28px] md:p-9 md:text-center">
          <div className="font-sans text-[13px] font-bold uppercase tracking-[0.2em] text-gold-deep">Before you tour</div>
          <p className="font-serif text-[26px] font-medium leading-[1.2] md:text-[34px]">
            Please do not visit a sales office or register on a builder&apos;s website until we have talked.
          </p>
          <p className="font-sans text-[15px] leading-[1.55] text-muted-2 md:text-[17px]">
            Most builders will not pay a commission on a buyer who walked in first, and without that commission there
            is nothing to rebate.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-[1312px] px-5 md:mt-12 md:px-8">
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3 md:gap-6">
          {nextSteps.map((s) => (
            <div key={s.n} className="flex flex-col gap-2.5 rounded-[22px] bg-sand p-6 md:gap-4 md:rounded-[28px] md:p-9">
              <div className="font-serif text-[40px] leading-none text-gold-deep md:text-[54px]">{s.n}</div>
              <h2 className="font-sans text-[19px] font-semibold tracking-[-0.01em] md:text-[21px]">{s.title}</h2>
              <p className="font-sans text-[15px] leading-[1.55] text-muted-2 md:text-[16px]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1312px] px-5 pb-16 pt-10 md:px-8 md:pb-24 md:pt-14">
        <div className="flex flex-col gap-5 rounded-[24px] bg-graphite p-7 text-sand md:flex-row md:items-center md:justify-between md:gap-10 md:rounded-[32px] md:px-14 md:py-12">
          <div className="flex flex-col gap-2.5">
            <h2 className="font-serif text-[30px] font-medium leading-[1.1] text-sand md:text-[38px]">
              Pick a time that works for you.
            </h2>
            <p className="font-sans text-[15px] leading-[1.5] text-ivory-2 md:text-[17px]">
              Or call or text{" "}
              <a href={rebateContact.phoneHref} className="text-sand no-underline hover:text-gold-3">
                {rebateContact.phoneDisplay}
              </a>{" "}
              and we will get you on the calendar.
            </p>
          </div>
          <a
            href={rebateContact.bookingUrl}
            className="inline-flex h-14 shrink-0 items-center self-start rounded-full bg-sand px-[30px] font-sans text-[16px] font-semibold text-ink no-underline transition hover:bg-white md:self-auto"
          >
            Book the call
          </a>
        </div>
        <p className="mt-5 font-sans text-[14px] text-muted-2 md:text-center md:text-[15px]">
          Want the details first?{" "}
          <a href="/rebate/terms" className="text-gold-deep underline underline-offset-4">
            Read the full program terms
          </a>
          .
        </p>
      </section>

      <RebateFooter base="/rebate" />
    </div>
  );
}
