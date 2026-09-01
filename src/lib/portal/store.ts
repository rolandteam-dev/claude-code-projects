"use client";

/**
 * Portal state — stored in the client's own browser, never on our servers.
 *
 * Design constraints this satisfies:
 *  - The site is fully static (SSG). There is no database and no login, so a
 *    client's progress lives in localStorage under one versioned key.
 *  - Several components render the same state at once (dashboard, sub-nav,
 *    save buttons). `useSyncExternalStore` keeps them in lockstep and also
 *    syncs across tabs via the `storage` event.
 *  - Nothing here reads localStorage during render, so server and first client
 *    render agree and hydration stays clean.
 *
 * What *does* leave the browser is engagement + contact info, sent to Follow Up
 * Boss by `track.ts` so the agent sees activity in the CRM.
 */

import { useCallback, useSyncExternalStore } from "react";
import type { JourneyKind } from "@/content/portal";

const KEY = "rl.portal.v1";

export type PortalProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  journey: JourneyKind;
  /** Free-text timeline, e.g. "0-3 months" */
  timeline: string;
  /** Target purchase price / expected sale price */
  budget: number;
  /** Areas the client is focused on (community or city names) */
  areas: string[];
  createdAt: string;
};

export type SavedSearch = {
  id: string;
  label: string;
  /** Query string for /listings, e.g. "city=Henderson&minBeds=3" */
  query: string;
  createdAt: string;
};

export type PortalState = {
  v: 1;
  profile: PortalProfile | null;
  /** Task ids from src/content/portal.ts that the client has checked off */
  done: string[];
  /** Listing ids the client has saved */
  saved: string[];
  searches: SavedSearch[];
  /** Free-text notes keyed by listing id */
  notes: Record<string, string>;
  updatedAt: string;
};

export const emptyState: PortalState = {
  v: 1,
  profile: null,
  done: [],
  saved: [],
  searches: [],
  notes: {},
  updatedAt: "",
};

/* ---------------------------------------------------------------- store --- */

let cache: PortalState = emptyState;
let cacheRaw: string | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): PortalState {
  if (!raw) return emptyState;
  try {
    const parsed = JSON.parse(raw) as Partial<PortalState>;
    if (!parsed || parsed.v !== 1) return emptyState;
    return {
      v: 1,
      profile: parsed.profile ?? null,
      done: Array.isArray(parsed.done) ? parsed.done : [],
      saved: Array.isArray(parsed.saved) ? parsed.saved : [],
      searches: Array.isArray(parsed.searches) ? parsed.searches : [],
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      updatedAt: parsed.updatedAt ?? "",
    };
  } catch {
    // Corrupt or hand-edited value — start clean rather than crashing the app.
    return emptyState;
  }
}

/**
 * Returns a stable reference unless the underlying string changed, which is
 * what `useSyncExternalStore` requires to avoid infinite re-render loops.
 */
function read(): PortalState {
  if (typeof window === "undefined") return emptyState;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Private mode / storage disabled — the portal still works for this visit.
    return cache;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = parse(raw);
  }
  return cache;
}

function emit() {
  for (const l of listeners) l();
}

function write(next: PortalState) {
  cache = { ...next, updatedAt: new Date().toISOString() };
  try {
    cacheRaw = JSON.stringify(cache);
    window.localStorage.setItem(KEY, cacheRaw);
  } catch {
    // Storage unavailable: keep the in-memory copy so the UI stays responsive.
    cacheRaw = null;
  }
  emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Server snapshot is always the empty state — the portal renders its signed-out shell first. */
function serverSnapshot(): PortalState {
  return emptyState;
}

/* ----------------------------------------------------------------- hook --- */

export type PortalActions = {
  setProfile(p: PortalProfile): void;
  updateProfile(patch: Partial<PortalProfile>): void;
  toggleTask(id: string): void;
  toggleSaved(id: string): void;
  isSaved(id: string): boolean;
  addSearch(s: Omit<SavedSearch, "id" | "createdAt">): void;
  removeSearch(id: string): void;
  setNote(listingId: string, note: string): void;
  reset(): void;
};

export function usePortal(): { state: PortalState; ready: boolean } & PortalActions {
  const state = useSyncExternalStore(subscribe, read, serverSnapshot);
  // `ready` distinguishes "no profile yet" from "we haven't read storage yet",
  // so the dashboard doesn't flash the onboarding form at a returning client.
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const setProfile = useCallback((p: PortalProfile) => write({ ...read(), profile: p }), []);

  const updateProfile = useCallback((patch: Partial<PortalProfile>) => {
    const cur = read();
    if (!cur.profile) return;
    write({ ...cur, profile: { ...cur.profile, ...patch } });
  }, []);

  const toggleTask = useCallback((id: string) => {
    const cur = read();
    const done = cur.done.includes(id) ? cur.done.filter((d) => d !== id) : [...cur.done, id];
    write({ ...cur, done });
  }, []);

  const toggleSaved = useCallback((id: string) => {
    const cur = read();
    const saved = cur.saved.includes(id) ? cur.saved.filter((s) => s !== id) : [id, ...cur.saved];
    write({ ...cur, saved });
  }, []);

  const isSaved = useCallback((id: string) => state.saved.includes(id), [state.saved]);

  const addSearch = useCallback((s: Omit<SavedSearch, "id" | "createdAt">) => {
    const cur = read();
    if (cur.searches.some((x) => x.query === s.query)) return;
    const entry: SavedSearch = { ...s, id: `s${Date.now()}`, createdAt: new Date().toISOString() };
    write({ ...cur, searches: [entry, ...cur.searches] });
  }, []);

  const removeSearch = useCallback((id: string) => {
    const cur = read();
    write({ ...cur, searches: cur.searches.filter((s) => s.id !== id) });
  }, []);

  const setNote = useCallback((listingId: string, note: string) => {
    const cur = read();
    const notes = { ...cur.notes };
    if (note.trim()) notes[listingId] = note;
    else delete notes[listingId];
    write({ ...cur, notes });
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    cacheRaw = null;
    cache = emptyState;
    emit();
  }, []);

  return {
    state,
    ready,
    setProfile,
    updateProfile,
    toggleTask,
    toggleSaved,
    isSaved,
    addSearch,
    removeSearch,
    setNote,
    reset,
  };
}

/** Read the stored state outside React (used by the save button on listing pages). */
export function peekPortal(): PortalState {
  return read();
}
