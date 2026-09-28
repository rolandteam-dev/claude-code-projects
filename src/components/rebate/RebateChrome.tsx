import { rebateContact } from "@/content/newConstructionRebate";

/**
 * Slim chrome for rebate.therolandteam.com: wordmark, phone, one button. Same
 * shape as the guide page chrome, different copy and links. On the rebate
 * host the page is served at "/" and its subpages at "/thank-you" and
 * "/terms"; everywhere else they sit under "/rebate". `base` carries that.
 */
export function RebateTopBar({ cta = true, base = "" }: { cta?: boolean; base?: string }) {
  return (
    <header className="border-b border-line-soft">
      <div className="mx-auto flex h-[60px] max-w-[1312px] items-center justify-between px-5 md:h-[72px] md:px-8">
        <div className="flex items-baseline gap-3">
          <a
            href={base || "/"}
            className="font-sans text-[12px] font-bold uppercase tracking-[0.22em] text-ink no-underline md:text-[13px]"
          >
            The Roland Team
          </a>
          <span className="hidden font-sans text-[12px] tracking-[0.08em] text-muted-2 md:inline">LPT Realty</span>
        </div>
        <div className="flex items-center gap-4 md:gap-7">
          <a
            href={rebateContact.phoneHref}
            className="hidden font-sans text-[15px] text-ink no-underline hover:text-gold-deep md:inline"
          >
            Call or text {rebateContact.phoneDisplay}
          </a>
          {cta ? (
            <a
              href="#rebate-form"
              className="inline-flex h-[38px] items-center rounded-full bg-ink px-4 font-sans text-[13px] font-semibold text-white no-underline transition hover:bg-graphite-2 md:h-11 md:px-[22px] md:text-[14px]"
            >
              Claim the rebate
            </a>
          ) : (
            <a
              href={rebateContact.phoneHref}
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

/** Footer: identity, licenses, phone, terms, privacy, fair housing. */
export function RebateFooter({ base = "" }: { base?: string }) {
  return (
    <footer className="mt-auto border-t border-line-soft">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-3 px-5 py-7 font-sans text-[13px] leading-[1.5] text-muted-2 md:px-8 md:py-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            {rebateContact.legalName}
            <span className="hidden md:inline"> · {rebateContact.address}</span>
            <span className="block md:hidden">{rebateContact.address}</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <a href={rebateContact.phoneHref} className="no-underline hover:text-gold-deep">
              {rebateContact.phoneDisplay}
            </a>
            <a href={`mailto:${rebateContact.email}`} className="hidden no-underline hover:text-gold-deep md:inline">
              {rebateContact.email}
            </a>
            <a href={`${base}/terms`} className="no-underline hover:text-gold-deep">
              Rebate terms
            </a>
            <a href={rebateContact.privacyUrl} className="no-underline hover:text-gold-deep">
              Privacy
            </a>
            <span>Equal Housing Opportunity</span>
          </div>
        </div>
        <div className="text-[12px] text-muted-2/80">
          {rebateContact.agentLicense} · {rebateContact.brokerLicense}. Rebate paid by LPT Realty at closing as a
          credit toward closing costs, subject to lender approval and a signed buyer agreement before your first
          builder visit. Not a builder program.
        </div>
      </div>
    </footer>
  );
}
