/**
 * Branded blog cover — a magazine-style frame over a photo: a top brand bar,
 * a category eyebrow + title card, and a gold monogram. Falls back to the
 * brand gradient (and any SVG coverImage) when no photo is present.
 */
export function BlogCover({
  category,
  title,
  subtitle,
  photo,
  fallback,
}: {
  category: string;
  title: string;
  subtitle?: string;
  photo?: string;
  fallback?: string;
}) {
  const bg = photo ?? fallback;
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-3)]">
      {bg && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg})` }}
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" aria-hidden="true" />

      {/* Top brand bar */}
      <div className="relative z-10 flex items-center justify-center border-b border-[var(--color-gold-3)]/25 bg-[var(--color-graphite-3)]/85 py-2 backdrop-blur-sm">
        <span className="font-serif text-[0.62rem] uppercase tracking-[0.34em] text-[var(--color-gold-3)]">
          The Roland Team
        </span>
      </div>

      {/* Title card */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <div className="inline-block max-w-[85%] rounded-[6px] border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-sm">
          <div className="font-sans text-[0.58rem] uppercase tracking-[0.22em] text-[var(--color-gold-3)]">
            {category}
          </div>
          <div className="mt-1 font-serif text-[1.15rem] font-semibold leading-[1.15] text-white">{title}</div>
          {subtitle && <div className="mt-1 font-serif text-[0.82rem] italic text-white/75">{subtitle}</div>}
        </div>
      </div>

      {/* Monogram */}
      <div className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-gold-3)]/50 bg-black/45 font-serif text-[0.95rem] text-[var(--color-gold-3)]">
        ✦
      </div>
    </div>
  );
}
