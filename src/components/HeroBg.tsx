import Image from "next/image";

/**
 * Absolutely-positioned cinematic hero background. Deep gradient + bottom
 * vignette keep ivory text legible over dramatic photography, with a slow
 * ambient zoom (disabled under prefers-reduced-motion via globals).
 *
 * Drop inside a `relative` hero; give sibling content `relative z-10`. The
 * parent should keep a graphite background as fallback.
 */
export function HeroBg({ src, priority = false }: { src: string; priority?: boolean }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="hero-kenburns absolute inset-0">
        <Image src={src} alt="" fill priority={priority} sizes="100vw" className="object-cover" />
      </div>
      {/* Directional wash for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(14,16,20,0.92)] via-[rgba(14,16,20,0.70)] to-[rgba(14,16,20,0.48)]" />
      {/* Bottom vignette so headlines and CTAs anchor cleanly */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(14,16,20,0.85)] to-transparent" />
      <style>{`
        @keyframes hero-zoom { from { transform: scale(1.04); } to { transform: scale(1.12); } }
        .hero-kenburns { animation: hero-zoom 22s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) { .hero-kenburns { animation: none; } }
      `}</style>
    </div>
  );
}
