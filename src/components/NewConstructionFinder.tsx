"use client";

import { useState } from "react";
import Link from "next/link";
import { ListingCard } from "./ListingCard";
import type { Listing } from "@/lib/idx/types";
import { site } from "@/lib/site";

// Areas the GLVAR feed filters natively — kept in step with the API route's
// ALLOWED_CITIES and the /listings city facet.
const AREAS = ["Las Vegas", "Henderson", "North Las Vegas", "Boulder City"] as const;
type Area = (typeof AREAS)[number];

type State =
  | { kind: "idle" }
  | { kind: "loading"; area: Area }
  | { kind: "done"; area: Area; listings: Listing[] }
  | { kind: "error"; area: Area };

export function NewConstructionFinder() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function pick(area: Area) {
    setState({ kind: "loading", area });
    try {
      const res = await fetch(`/api/new-construction?city=${encodeURIComponent(area)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setState({ kind: "error", area });
        return;
      }
      setState({ kind: "done", area, listings: (data.listings ?? []) as Listing[] });
    } catch {
      setState({ kind: "error", area });
    }
  }

  const activeArea = state.kind === "idle" ? null : state.area;

  return (
    <div>
      {/* Area picker */}
      <div className="flex flex-wrap gap-3" role="group" aria-label="Choose an area">
        {AREAS.map((area) => {
          const active = activeArea === area;
          return (
            <button
              key={area}
              type="button"
              onClick={() => pick(area)}
              aria-pressed={active}
              className={[
                "rounded-full border px-5 py-2.5 font-sans text-[0.9rem] font-medium transition-colors",
                active
                  ? "border-[var(--color-graphite)] bg-[var(--color-graphite)] text-white"
                  : "border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-graphite)]",
              ].join(" ")}
            >
              {area}
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div className="mt-8" aria-live="polite">
        {state.kind === "idle" && (
          <p className="text-[var(--color-ink-soft)]">
            Choose an area above to see homes built in the last year or newer, straight from the live MLS.
          </p>
        )}

        {state.kind === "loading" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)]"
              />
            ))}
          </div>
        )}

        {state.kind === "done" && state.listings.length > 0 && (
          <>
            <p className="mb-6 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
              {state.listings.length} newly built {state.listings.length === 1 ? "home" : "homes"} in{" "}
              <strong className="text-[var(--color-ink)]">{state.area}</strong>
              {state.listings.length === 9 ? "+" : ""} · live from the MLS
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {state.listings.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
            <div className="mt-8">
              <Link
                href={`/listings?city=${encodeURIComponent(state.area)}&newConstruction=1`}
                className="btn btn-ghost"
              >
                See all new construction in {state.area}
              </Link>
            </div>
          </>
        )}

        {/* No live matches (empty feed, no key, or genuinely none listed) — never
            a dead end; route the buyer to us to hand-match builder inventory. */}
        {((state.kind === "done" && state.listings.length === 0) || state.kind === "error") && (
          <div className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-sand)] p-8">
            <h3 className="text-[1.25rem]">
              {state.kind === "error"
                ? "We couldn't load listings just now"
                : `No new-construction homes are on the MLS in ${state.area} this moment`}
            </h3>
            <p className="mt-2 max-w-[640px] text-[var(--color-ink-soft)]">
              New-build inventory moves fast, and many builder homes sell before they ever hit the MLS. Tell us what
              you&apos;re looking for and we&apos;ll match you with current builder releases in {activeArea ?? "the valley"} —
              and represent you with the builder at no cost to you.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link href={site.cta.href} className="btn">Get matched with builders</Link>
              {state.kind === "error" && activeArea && (
                <button type="button" onClick={() => pick(activeArea)} className="btn btn-ghost">
                  Try again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
