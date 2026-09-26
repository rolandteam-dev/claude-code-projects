import { guideContact } from "@/content/relocationGuides";

/** Slim top bar for the guide pages: wordmark, phone, one button. */
export function GuideTopBar({ cta = true }: { cta?: boolean }) {
  return (
    <header className="border-b border-line-soft">
      <div className="mx-auto flex h-[60px] max-w-[1312px] items-center justify-between px-5 md:h-[72px] md:px-8">
        <div className="flex items-baseline gap-3">
          <a href="#top" className="font-sans text-[12px] font-bold uppercase tracking-[0.22em] text-ink no-underline md:text-[13px]">
            The Roland Team
          </a>
          <span className="hidden font-sans text-[12px] tracking-[0.08em] text-muted-2 md:inline">LPT Realty</span>
        </div>
        <div className="flex items-center gap-4 md:gap-7">
          <a
            href={guideContact.phoneHref}
            className="hidden font-sans text-[15px] text-ink no-underline hover:text-gold-deep md:inline"
          >
            Call or text {guideContact.phoneDisplay}
          </a>
          {cta ? (
            <a
              href="#guide-form"
              className="inline-flex h-[38px] items-center rounded-full bg-ink px-4 font-sans text-[13px] font-semibold text-white no-underline transition hover:bg-graphite-2 md:h-11 md:px-[22px] md:text-[14px]"
            >
              Get the guides
            </a>
          ) : (
            <a
              href={guideContact.phoneHref}
              className="inline-flex h-[38px] items-center rounded-full border border-ink px-4 font-sans text-[13px] font-semibold text-ink no-underline md:hidden"
            >
              Call or text
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

/** Footer for the guide pages: identity, phone, privacy, fair housing. */
export function GuideFooter() {
  return (
    <footer className="mt-auto border-t border-line-soft">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-2 px-5 py-7 font-sans text-[13px] leading-[1.5] text-muted-2 md:flex-row md:items-center md:justify-between md:px-8 md:py-8">
        <div>
          {guideContact.legalName}
          <span className="hidden md:inline"> · {guideContact.address}</span>
          <span className="block md:hidden">{guideContact.address}</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <a href={guideContact.phoneHref} className="no-underline hover:text-gold-deep">
            {guideContact.phoneDisplay}
          </a>
          <a href={`mailto:${guideContact.email}`} className="hidden no-underline hover:text-gold-deep md:inline">
            {guideContact.email}
          </a>
          <a href={guideContact.privacyUrl} className="no-underline hover:text-gold-deep">
            Privacy
          </a>
          <span>Equal Housing Opportunity</span>
        </div>
      </div>
    </footer>
  );
}

/** Small-caps label above a heading. */
export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={[
        "font-sans text-[11px] font-bold uppercase tracking-[0.26em] md:text-[12px]",
        dark ? "text-gold-2" : "text-gold-deep",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
