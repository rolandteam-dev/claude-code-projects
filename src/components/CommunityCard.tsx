import Link from "next/link";
import type { Community } from "@/content/communities";

export function CommunityCard({ c }: { c: Community }) {
  const price = c.quickFacts.find((f) => /price/i.test(f.label))?.value;
  return (
    <Link
      href={`/communities/${c.slug}`}
      className="group block overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-white no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
    >
      <div className="flex h-36 items-end bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] p-5">
        <div>
          <div className="font-sans text-[0.68rem] uppercase tracking-[0.2em] text-[var(--color-gold-2)]">
            {c.city}, NV
          </div>
          <div className="font-sans text-[1.35rem] font-semibold text-white">{c.name}</div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-[0.92rem] leading-relaxed text-[var(--color-ink-soft)]">{c.intro}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {price && <span className="font-sans text-[0.82rem] font-semibold text-[var(--color-ink)]">{price}</span>}
          <span className="ml-auto font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-gold)] group-hover:underline">
            Explore →
          </span>
        </div>
      </div>
    </Link>
  );
}
