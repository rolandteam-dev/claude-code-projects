import { site } from "@/lib/site";

/**
 * Honest, attributed credibility block for seller pages.
 *
 * Renders only the team's already-verified published stats (`site.stats`) with
 * who-earned-it + as-of attribution — never an invented figure. This is the
 * "proof block" the Fello→Lofty playbook calls for: team + brokerage near the
 * top, every stat attributable and dated, nothing we can't back up. Update the
 * numbers in `site.stats` and the date in `site.statsAsOf` as the totals grow.
 */
export function ProofBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-[14px] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft)] ${className}`}>
      <div className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-gold)]">
        {site.name} · {site.brokerage}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {site.stats.map((s) => (
          <div key={s.label}>
            <div className="font-serif text-[1.7rem] font-semibold text-[var(--color-ink)]">{s.value}</div>
            <div className="font-sans text-[0.72rem] leading-tight text-[var(--color-ink-soft)]">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 font-sans text-[0.68rem] leading-relaxed text-[var(--color-muted)]">
        Figures earned by {site.name} and verified on the team&apos;s published Zillow &amp; Google profiles
        {site.statsAsOf ? `, as of ${site.statsAsOf}` : ""}. Past results don&apos;t guarantee future outcomes;
        individual results vary.
      </p>
    </div>
  );
}
