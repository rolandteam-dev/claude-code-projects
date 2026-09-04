import { site } from "@/lib/site";

/**
 * IDX attribution + disclaimer for listings sourced from the Las Vegas
 * REALTORS® (GLVAR) MLS via the Repliers IDX feed.
 *
 * This uses the standard GLVAR IDX / Internet Data Exchange disclaimer
 * language plus required brokerage identification and Fair Housing language.
 * NOTE: have the broker confirm the exact current GLVAR-required wording and
 * IDX logo usage before final sign-off — MLS boards update these periodically.
 *
 * Rendered small and low on the page: it satisfies the compliance minimum
 * without competing with the property content above it.
 */
function formatUpdated(iso?: string): string | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return undefined;
  return new Date(t).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function IdxDisclaimer({
  listingOffice,
  lastUpdated,
}: {
  /** Source listing brokerage — shown as the per-listing courtesy line. */
  listingOffice?: string;
  /** Most-recent feed update timestamp (ISO). */
  lastUpdated?: string;
}) {
  const year = new Date().getFullYear();
  const updated = formatUpdated(lastUpdated);

  return (
    <div className="mt-8 border-t border-[var(--color-line)] pt-4 font-sans text-[0.68rem] leading-relaxed text-[var(--color-muted)]">
      {listingOffice && (
        <p className="m-0">Listing courtesy of {listingOffice}.</p>
      )}
      <p className="m-0 mt-1">
        Listing data courtesy of Las Vegas REALTORS® (GLVAR). The data relating to real estate for sale on this
        website comes in part from the Internet Data Exchange (IDX) program of the Las Vegas REALTORS® MLS.
        Information is deemed reliable but not guaranteed. All properties are subject to prior sale, change, or
        withdrawal. {site.name}, brokered by {site.brokerage}, is not responsible for any typographical
        errors, misinformation, or misprints.
        {updated ? ` Data last updated ${updated}.` : ""}
      </p>
      <p className="m-0 mt-1">
        © {year} Las Vegas REALTORS®. All rights reserved. Equal Housing Opportunity. {site.name} —
        brokered by {site.brokerage}.
      </p>
    </div>
  );
}
