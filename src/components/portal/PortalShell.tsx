"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Container } from "@/components/Container";
import { usePortal } from "@/lib/portal/store";
import { journeyProgress } from "@/lib/portal/progress";
import { Onboarding } from "./Onboarding";
import { ProgressRing } from "./ui";

const TABS = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/journey", label: "My journey" },
  { href: "/portal/saved", label: "Saved homes" },
  { href: "/portal/budget", label: "My numbers" },
  { href: "/portal/pros", label: "My pros" },
] as const;

/**
 * Frame for every portal screen: identity strip, progress, and the tab bar.
 * Renders the sign-up form instead of `children` until a profile exists, so
 * each portal page can assume there is a client.
 *
 * `intro` is server-rendered marketing copy shown alongside the sign-up form
 * and dropped once the client has a hub — it keeps /portal worth indexing
 * without cluttering the app for people who are already using it.
 */
export function PortalShell({ children, intro }: { children: ReactNode; intro?: ReactNode }) {
  const pathname = usePathname();
  const { state, ready } = usePortal();
  const profile = state.profile;

  // Storage hasn't been read on the very first client render. Hold the layout
  // steady rather than flashing the sign-up form at a returning client.
  if (!ready) {
    return (
      <Container size="wide" className="py-16">
        <div className="h-64 animate-pulse rounded-[16px] border border-[var(--color-line)] bg-[var(--color-sand)]" />
      </Container>
    );
  }

  if (!profile) {
    return (
      <>
        <Container size="wide" className="py-12">
          <Onboarding />
        </Container>
        {intro}
      </>
    );
  }

  const progress = journeyProgress(profile.journey, state.done);

  return (
    <div>
      <div className="border-b border-[var(--color-line)] bg-[var(--color-sand)]">
        <Container size="wide" className="py-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <ProgressRing value={progress.done} total={progress.total} />
              <div>
                <div className="eyebrow">
                  {profile.journey === "sell" ? "Seller hub" : "Buyer hub"}
                  {progress.current ? ` · ${progress.current.label}` : " · Complete"}
                </div>
                <h1 className="mt-1 font-serif text-[2.1rem] leading-none text-[var(--color-ink)]">
                  {profile.firstName ? `${profile.firstName}'s home hub` : "Your home hub"}
                </h1>
                <p className="mt-2 font-sans text-[0.86rem] text-[var(--color-ink-soft)]">
                  {progress.done} of {progress.total} steps complete · {state.saved.length} saved{" "}
                  {state.saved.length === 1 ? "home" : "homes"}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-7 flex flex-wrap gap-1" aria-label="Portal">
            {TABS.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "rounded-full px-4 py-2 font-sans text-[0.85rem] no-underline transition-colors",
                    active
                      ? "bg-[var(--color-graphite)] text-white"
                      : "text-[var(--color-ink-soft)] hover:bg-white hover:text-[var(--color-gold)]",
                  ].join(" ")}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </Container>
      </div>

      <Container size="wide" className="py-12">{children}</Container>
    </div>
  );
}
