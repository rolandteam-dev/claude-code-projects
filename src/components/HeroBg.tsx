import Image from "next/image";

/**
 * Absolutely-positioned hero background image with a dark overlay so white
 * text stays legible. Drop inside a `relative` hero; give sibling content
 * `relative z-10`. The parent should keep a graphite background as fallback.
 */
export function HeroBg({ src, priority = false }: { src: string; priority?: boolean }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <Image src={src} alt="" fill priority={priority} sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(16,18,23,0.90)] via-[rgba(16,18,23,0.72)] to-[rgba(16,18,23,0.55)]" />
    </div>
  );
}
