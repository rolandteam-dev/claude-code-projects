import type { Metadata } from "next";
import { HomeEstimator } from "@/components/HomeEstimator";

export const metadata: Metadata = {
  title: "What's My Home Worth? | The Roland Team",
  description: "Instant, comp-based value range for your Las Vegas or Henderson home.",
  robots: { index: false, follow: false },
};

/**
 * Bare, embeddable home-value tool — no site header/footer (it lives outside the
 * marketing route group, so only the root layout wraps it). Designed to sit
 * inside an <iframe> on an external site (e.g. www.therolandteam.com) so the
 * visitor never leaves that domain. Single clean path: estimate → track this
 * home → private dashboard. The "precise CMA" link is hidden here (there's no
 * CMA section to scroll to in the embed).
 */
export default function EmbedHomeValuePage() {
  return (
    <main className="min-h-screen bg-[var(--color-sand)] px-4 py-8">
      <div className="mx-auto max-w-[440px]">
        <div className="mb-4 text-center">
          <div className="font-sans text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-gold)]">
            The Roland Team
          </div>
          <h1 className="mt-1 font-serif text-[1.7rem] leading-tight text-[var(--color-ink)]">
            What&apos;s my home worth?
          </h1>
          <p className="mt-1 font-sans text-[0.85rem] text-[var(--color-ink-soft)]">
            Instant range from recent sold comps in your ZIP — no obligation.
          </p>
        </div>
        <HomeEstimator showCmaButton={false} />
      </div>
    </main>
  );
}
