/**
 * IDX attribution + disclaimer. MLS IDX rules require displaying the source,
 * a disclaimer, and the listing brokerage. The exact wording GLVAR requires
 * must be pasted here before go-live — this is compliant-shaped placeholder
 * text, not GLVAR's official language.
 */
export function IdxDisclaimer({
  isSampleData,
  listingOffice,
}: {
  isSampleData: boolean;
  listingOffice?: string;
}) {
  return (
    <div className="mt-8 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-sand)] p-4 font-sans text-[0.72rem] leading-relaxed text-[var(--color-muted)]">
      {isSampleData ? (
        <p className="m-0">
          <strong>Sample data.</strong> These are placeholder listings for layout preview only and do not
          represent homes for sale. Live MLS listings will appear here once the GLVAR IDX feed is connected.
        </p>
      ) : (
        <>
          {listingOffice && <p className="m-0">Listing courtesy of {listingOffice}.</p>}
          <p className="m-0 mt-1">
            Information is provided exclusively for consumers&apos; personal, non-commercial use and may not be
            used for any purpose other than to identify prospective properties. Information deemed reliable but
            not guaranteed. Data last updated periodically. [Replace with GLVAR-required IDX disclaimer.]
          </p>
        </>
      )}
    </div>
  );
}
