import type { RelocationGuide } from "@/content/relocationGuides";

/**
 * A guide rendered as a physical book cover, in CSS. Everything inside is
 * sized in em, so one `fontSize` scales the whole cover: 10px renders a
 * 340 x 460 cover, 5px a 170 x 230 one. Rotation and shadow come from the
 * parent through `className` so the same cover can sit flat on a card or
 * tilted on the hero stage.
 */
export function GuideCover({
  guide,
  fontSize,
  className = "",
  showTagline = true,
}: {
  guide: Pick<RelocationGuide, "title" | "tagline" | "part" | "cover">;
  /** Omit to inherit the parent's font-size (lets Tailwind breakpoints scale the cover). */
  fontSize?: string;
  className?: string;
  showTagline?: boolean;
}) {
  const dark = guide.cover === "dark";
  return (
    <div
      aria-hidden="true"
      style={fontSize ? { fontSize } : undefined}
      className={[
        "relative flex h-[46em] w-[34em] shrink-0 flex-col justify-between rounded-[0.8em] p-[3.6em] pb-[3.2em]",
        dark ? "bg-graphite text-sand" : "bg-ivory text-ink",
        className,
      ].join(" ")}
    >
      {/* Spine */}
      <div
        className={[
          "absolute bottom-0 left-0 top-0 w-[1.6em] rounded-l-[0.8em]",
          dark ? "bg-white/[0.07]" : "bg-ink/[0.05]",
        ].join(" ")}
      />
      {/* Inner rule */}
      <div
        className={[
          "absolute inset-[1.6em] rounded-[0.4em] border",
          dark ? "border-gold-3/35" : "border-gold/35",
        ].join(" ")}
      />
      <div
        className={[
          "text-[1.1em] font-bold uppercase tracking-[0.26em]",
          dark ? "text-gold-2" : "text-gold-deep",
        ].join(" ")}
      >
        The Roland Team
      </div>
      <div className="flex flex-col gap-[1.4em]">
        <div className="font-serif text-[4.6em] font-medium leading-[1.02] tracking-[-0.01em]">
          {guide.title}
        </div>
        {showTagline && (
          <div className={["text-[1.4em] leading-[1.5]", dark ? "text-ivory-2" : "text-muted-2"].join(" ")}>
            {guide.tagline}
          </div>
        )}
      </div>
      <div
        className={[
          "text-[1.1em] uppercase tracking-[0.18em]",
          dark ? "text-gold-2" : "text-gold-deep",
        ].join(" ")}
      >
        {guide.part} · 2026 edition
      </div>
    </div>
  );
}
