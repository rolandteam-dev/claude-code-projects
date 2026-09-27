import type { Metadata } from "next";
import { combinedGuidePdfUrl, guideContact, relocationGuides } from "@/content/relocationGuides";
import { GuideCover } from "@/components/guide/GuideCover";
import { Eyebrow, GuideFooter, GuideTopBar } from "@/components/guide/GuideChrome";

/**
 * Where the form lands. Both guides open right here (read online, or the
 * PDF), so nobody has to wait for an email. Not indexed: it is the reward for
 * filling in the form, not a page to find on Google.
 */
export const metadata: Metadata = {
  title: "Your guides are ready",
  robots: { index: false, follow: false },
};

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

/** Only a plain first name is greeted; anything odd in the URL is ignored. */
function cleanFirstName(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  return /^[A-Za-z][A-Za-z' -]{0,29}$/.test(v) ? v : "";
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const { first } = await searchParams;
  const name = cleanFirstName(first);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <GuideTopBar cta={false} />

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
        <h1 className="font-serif text-[52px] font-medium leading-[0.98] tracking-[-0.015em] md:text-[88px] md:leading-[1]">
          {name ? `${name}, your guides are ready.` : "Your guides are ready."}
        </h1>
        <p className="max-w-[720px] font-sans text-[17px] leading-[1.5] text-muted-2 md:text-[21px]">
          Open either one now. Both are yours to keep, and we sent the links to your email so you can find them
          again from your phone.
        </p>
      </section>

      <section className="mx-auto mt-8 grid w-full max-w-[1312px] grid-cols-1 gap-4 px-5 md:mt-[52px] md:grid-cols-2 md:gap-6 md:px-8">
        {relocationGuides.map((g) => (
          <div
            key={g.slug}
            className="flex flex-col gap-5 rounded-[24px] bg-sand p-6 md:flex-row md:items-center md:gap-8 md:rounded-[32px] md:p-9"
          >
            <div className="text-[4.2px] md:text-[4.95px]">
              <GuideCover
                guide={g}
                showTagline={false}
                className={g.cover === "dark" ? "shadow-[0_18px_36px_rgba(20,22,27,0.25)]" : "border border-line shadow-[0_18px_36px_rgba(20,22,27,0.18)]"}
              />
            </div>
            <div className="flex flex-col gap-3 md:gap-3.5">
              <Eyebrow>{g.part}</Eyebrow>
              <h2 className="font-serif text-[30px] font-medium leading-[1.05] md:text-[36px]">{g.title}</h2>
              <p className="font-sans text-[15px] leading-[1.5] text-muted-2 md:text-[16px]">{g.blurb}</p>
              <div className="mt-1.5 flex flex-wrap gap-3">
                <a
                  href={g.readUrl}
                  className="inline-flex h-12 items-center rounded-full bg-ink px-[22px] font-sans text-[15px] font-semibold text-white no-underline transition hover:bg-graphite-2"
                >
                  Read online
                </a>
                <a
                  href={g.pdfUrl}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-ink px-[22px] font-sans text-[15px] font-semibold text-ink no-underline transition hover:bg-white"
                >
                  <DownloadIcon />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </section>

      <p className="mx-auto mt-5 w-full max-w-[1312px] px-5 font-sans text-[14px] text-muted-2 md:mt-6 md:px-8 md:text-center md:text-[15px]">
        Prefer one file?{" "}
        <a href={combinedGuidePdfUrl} className="text-gold-deep underline underline-offset-4">
          Download both guides as a single PDF
        </a>
        .
      </p>

      <section className="mx-auto w-full max-w-[1312px] px-5 pb-16 pt-12 md:px-8 md:pb-24 md:pt-16">
        <div className="flex flex-col gap-5 rounded-[24px] bg-graphite p-7 text-sand md:flex-row md:items-center md:justify-between md:gap-10 md:rounded-[32px] md:px-14 md:py-12">
          <div className="flex flex-col gap-2.5">
            <h2 className="font-serif text-[30px] font-medium leading-[1.1] text-sand md:text-[38px]">
              Want a second opinion on a neighborhood?
            </h2>
            <p className="font-sans text-[15px] leading-[1.5] text-ivory-2 md:text-[17px]">
              Call or text{" "}
              <a href={guideContact.phoneHref} className="text-sand no-underline hover:text-gold-3">
                {guideContact.phoneDisplay}
              </a>
              , or book fifteen minutes with Mike. No pitch, just answers.
            </p>
          </div>
          <a
            href={guideContact.bookingUrl}
            className="inline-flex h-14 shrink-0 items-center self-start rounded-full bg-sand px-[30px] font-sans text-[16px] font-semibold text-ink no-underline transition hover:bg-white md:self-auto"
          >
            Book a call
          </a>
        </div>
      </section>

      <GuideFooter />
    </div>
  );
}
