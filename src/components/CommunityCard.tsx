import Link from "next/link";
import Image from "next/image";
import type { Community } from "@/content/communities";
import { communityHero } from "@/lib/heroImages";

export function CommunityCard({ c }: { c: Community }) {
  const price = c.quickFacts.find((f) => /price/i.test(f.label))?.value;
  return (
    <Link
      href={`/communities/${c.slug}`}
      className="group block overflow-hidden rounded-[4px] border border-[var(--color-line)] bg-white no-underline shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="img-zoom relative h-52 overflow-hidden bg-[var(--color-graphite)]">
        <Image
          src={communityHero(c.slug)}
          alt={`${c.name}, ${c.city}, Nevada`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(14,16,20,0.88)] via-[rgba(14,16,20,0.25)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="font-sans text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-gold-3)]">
            {c.city}, NV
          </div>
          <div className="mt-0.5 font-serif text-[1.5rem] font-medium leading-tight text-white">{c.name}</div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-[0.98rem] leading-relaxed text-[var(--color-ink-soft)]">{c.intro}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[var(--color-line)] pt-4">
          {price && <span className="font-sans text-[0.8rem] font-semibold text-[var(--color-ink)]">{price}</span>}
          <span className="ml-auto font-sans text-[0.76rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-gold)] group-hover:text-[var(--color-gold-3)]">
            Explore →
          </span>
        </div>
      </div>
    </Link>
  );
}
