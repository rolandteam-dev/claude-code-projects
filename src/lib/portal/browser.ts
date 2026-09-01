"use client";

/**
 * Reading browser-only values (URL, origin, sessionStorage) from a component
 * that also prerenders.
 *
 * The obvious approach — read in an effect, setState — triggers a cascading
 * render and is what React's `set-state-in-effect` rule warns about.
 * `useSyncExternalStore` is the supported way: the server snapshot renders
 * first, the real value arrives on hydration, and every consumer stays
 * consistent. All snapshots below return primitives, so identity is stable and
 * there's no render loop.
 */

import { useSyncExternalStore } from "react";

/** Values that only change on navigation. */
function subscribeToNavigation(cb: () => void): () => void {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
}

/** Values we read once and that nothing else in the app mutates. */
function subscribeToNothing(): () => void {
  return () => {};
}

/** The current query string, including the leading "?" ("" while prerendering). */
export function useLocationSearch(): string {
  return useSyncExternalStore(
    subscribeToNavigation,
    () => window.location.search,
    () => "",
  );
}

/** The site's own origin, for building absolute links client-side. */
export function useOrigin(): string {
  return useSyncExternalStore(
    subscribeToNothing,
    () => window.location.origin,
    () => "",
  );
}

/** A sessionStorage value, or "" when unset or storage is unavailable. */
export function useSessionValue(key: string): string {
  return useSyncExternalStore(
    subscribeToNothing,
    () => {
      try {
        return window.sessionStorage.getItem(key) ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );
}
