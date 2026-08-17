"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BEHAVIOR_EVENT,
  computeSignals,
  getProfile,
  markDismissed,
  markNudged,
  type ViewedListing,
} from "./behavior";
import { getIdentity } from "./identity";
import { CONFIG, pickNudge, similarQuery, type Nudge } from "./triggers";

const TICK_MS = 5_000;

/** The home they're looking at right now, if this is a listing page. */
function currentListing(pathname: string): ViewedListing | null {
  const match = pathname.match(/^\/listings\/([^/?#]+)/);
  if (!match) return null;
  return getProfile().listings.find((l) => l.id === match[1]) ?? null;
}

/**
 * Watches this visit and decides when the concierge should speak first.
 *
 * Re-evaluates on a slow tick (so dwell time can mature), whenever behavior is
 * recorded, and on exit intent. Once a nudge fires it's recorded as used and
 * evaluation stops until the caller clears it — a visitor never gets two
 * proactive messages stacked on top of each other.
 *
 * In assertive mode the nudge is handed to `onAutoOpen` instead of being
 * returned, so the caller can open the chat panel around it rather than
 * showing a teaser. Phones never get their screen taken over.
 */
export function useProactiveNudge(enabled: boolean, onAutoOpen?: (n: Nudge) => void) {
  const pathname = usePathname();
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const arrivedAt = useRef(0);
  const exitIntent = useRef(false);
  const held = useRef(false); // a nudge is live — stop evaluating
  const autoOpen = useRef(onAutoOpen);

  // Keep the callback current without re-subscribing the listeners below.
  useEffect(() => {
    autoOpen.current = onAutoOpen;
  });

  // Every new page is a fresh dwell clock.
  useEffect(() => {
    arrivedAt.current = Date.now();
    exitIntent.current = false;
  }, [pathname]);

  const evaluate = useCallback(() => {
    if (!enabled || held.current || !arrivedAt.current) return;
    const signals = computeSignals({
      dwellSeconds: Math.round((Date.now() - arrivedAt.current) / 1000),
      currentListing: currentListing(pathname),
      identified: Boolean(getIdentity()),
      exitIntent: exitIntent.current,
    });
    const next = pickNudge(signals);
    if (!next) return;
    held.current = true;
    markNudged(next.id);
    const ready = { ...next, similar: similarQuery(signals) };

    const phone = window.matchMedia("(max-width: 640px)").matches;
    if (CONFIG.autoOpen && !phone && autoOpen.current) {
      autoOpen.current(ready);
      return;
    }
    setNudge(ready);
  }, [enabled, pathname]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(evaluate, TICK_MS);
    window.addEventListener(BEHAVIOR_EVENT, evaluate);

    // Desktop exit intent: cursor leaving through the top of the viewport.
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY > 0 || e.relatedTarget) return;
      exitIntent.current = true;
      evaluate();
    };
    document.addEventListener("mouseout", onMouseOut);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(BEHAVIOR_EVENT, evaluate);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [enabled, evaluate]);

  /** They engaged (or we moved it into the chat) — clear without penalty. */
  const clear = useCallback(() => {
    held.current = false;
    setNudge(null);
  }, []);

  /** They said "not now" — clear and remember to back off. */
  const dismiss = useCallback(() => {
    markDismissed();
    held.current = false;
    setNudge(null);
  }, []);

  return { nudge, clear, dismiss };
}
