/**
 * Visitor behavior store for the AI concierge.
 *
 * Everything here is client-side only (localStorage for the lifetime profile,
 * sessionStorage for this-visit state) — no cookies, no server profile, no PII
 * unless the visitor hands it to us through a form.
 *
 * The concierge reads these signals to decide when to speak first: how many
 * homes they've opened, which area they keep coming back to, the price band
 * they're shopping, whether they're a repeat visitor, and how long they've
 * lingered on the home in front of them.
 */

export type ViewedListing = {
  id: string;
  price: number;
  beds: number;
  baths: number;
  sqft?: number;
  street: string;
  city: string;
  state: string;
  postalCode?: string;
  mlsNumber?: string;
  propertyType?: string;
  communitySlug?: string;
  communityName?: string;
  url: string;
  at: number;
};

export type Profile = {
  v: 1;
  firstSeen: number;
  lastSeen: number;
  /** number of distinct visits (tab sessions) */
  sessions: number;
  listings: ViewedListing[];
  communities: { slug: string; name: string; at: number }[];
  searches: { url: string; label: string; at: number }[];
  /** views of /home-value, /sell and other seller-intent pages */
  sellerSignals: number;
  pageViews: number;
  /** trigger ids already used, so we never repeat the same line */
  nudged: string[];
  dismissals: number;
  lastNudgeAt: number;
  lastDismissAt: number;
  /** true once they've submitted any form on the site */
  converted: boolean;
};

export type SessionState = {
  startedAt: number;
  nudges: number;
  /** keys already reported to the CRM this visit (dedupe) */
  reported: string[];
};

const PROFILE_KEY = "rl_behavior_v1";
const SESSION_KEY = "rl_session_v1";
const MAX_LISTINGS = 40;
const MAX_SEARCHES = 12;

/** Fired whenever the profile changes so the concierge can re-evaluate. */
export const BEHAVIOR_EVENT = "rl:behavior";

const EMPTY: Profile = {
  v: 1,
  firstSeen: 0,
  lastSeen: 0,
  sessions: 0,
  listings: [],
  communities: [],
  searches: [],
  sellerSignals: 0,
  pageViews: 0,
  nudged: [],
  dismissals: 0,
  lastNudgeAt: 0,
  lastDismissAt: 0,
  converted: false,
};

const hasWindow = () => typeof window !== "undefined";

export function getProfile(): Profile {
  if (!hasWindow()) return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...EMPTY };
    const p = JSON.parse(raw) as Partial<Profile>;
    return {
      ...EMPTY,
      ...p,
      listings: Array.isArray(p.listings) ? p.listings : [],
      communities: Array.isArray(p.communities) ? p.communities : [],
      searches: Array.isArray(p.searches) ? p.searches : [],
      nudged: Array.isArray(p.nudged) ? p.nudged : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

function save(p: Profile, notify = true) {
  if (!hasWindow()) return;
  try {
    p.lastSeen = Date.now();
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    if (notify) window.dispatchEvent(new Event(BEHAVIOR_EVENT));
  } catch {
    /* storage full or blocked — behavior tracking is best-effort */
  }
}

function update(fn: (p: Profile) => void, notify = true) {
  const p = getProfile();
  if (!p.firstSeen) p.firstSeen = Date.now();
  fn(p);
  save(p, notify);
}

export function getSession(): SessionState {
  if (!hasWindow()) return { startedAt: Date.now(), nudges: 0, reported: [] };
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<SessionState>;
      return {
        startedAt: s.startedAt || Date.now(),
        nudges: s.nudges || 0,
        reported: Array.isArray(s.reported) ? s.reported : [],
      };
    }
  } catch {
    /* fall through to a fresh session */
  }
  return { startedAt: Date.now(), nudges: 0, reported: [] };
}

function saveSession(s: SessionState) {
  if (!hasWindow()) return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* best-effort */
  }
}

/** Called once per tab session; counts the visit so we can spot repeat shoppers. */
export function startSession() {
  if (!hasWindow()) return;
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return;
  saveSession({ startedAt: Date.now(), nudges: 0, reported: [] });
  update((p) => {
    p.sessions += 1;
  });
}

export function trackPageView() {
  update((p) => {
    p.pageViews += 1;
  }, false);
}

export function trackListing(l: Omit<ViewedListing, "at">) {
  update((p) => {
    const at = Date.now();
    // Re-opening the same home refreshes its timestamp instead of duplicating.
    p.listings = [{ ...l, at }, ...p.listings.filter((x) => x.id !== l.id)].slice(0, MAX_LISTINGS);
  });
}

export function trackCommunity(slug: string, name: string) {
  update((p) => {
    const at = Date.now();
    p.communities = [{ slug, name, at }, ...p.communities.filter((c) => c.slug !== slug)].slice(0, 20);
  });
}

export function trackSearch(url: string, label: string) {
  update((p) => {
    const at = Date.now();
    p.searches = [{ url, label, at }, ...p.searches.filter((s) => s.url !== url)].slice(0, MAX_SEARCHES);
  });
}

export function trackSellerSignal() {
  update((p) => {
    p.sellerSignals += 1;
  });
}

/** Remember that this visitor already gave us their details. */
export function markConverted() {
  update((p) => {
    p.converted = true;
  });
}

export function markNudged(id: string) {
  update((p) => {
    if (!p.nudged.includes(id)) p.nudged.push(id);
    p.lastNudgeAt = Date.now();
  });
  const s = getSession();
  s.nudges += 1;
  saveSession(s);
}

export function markDismissed() {
  update((p) => {
    p.dismissals += 1;
    p.lastDismissAt = Date.now();
  });
}

/** True the first time this key is claimed in this visit — CRM dedupe. */
export function claimOncePerSession(key: string): boolean {
  const s = getSession();
  if (s.reported.includes(key)) return false;
  s.reported.push(key);
  saveSession(s);
  return true;
}

/* ------------------------------------------------------------------ */
/* Derived signals                                                     */
/* ------------------------------------------------------------------ */

export type AreaCount = { key: string; label: string; kind: "community" | "city"; count: number };

export type Signals = {
  sessions: number;
  repeatVisitor: boolean;
  listingViews: number;
  sessionListingViews: number;
  topArea: AreaCount | null;
  areasSeen: number;
  minPrice: number | null;
  maxPrice: number | null;
  medianPrice: number | null;
  typicalBeds: number | null;
  searches: number;
  sellerSignals: number;
  pageViews: number;
  sessionSeconds: number;
  /** seconds on the page currently in front of them */
  dwellSeconds: number;
  currentListing: ViewedListing | null;
  lastListing: ViewedListing | null;
  identified: boolean;
  converted: boolean;
  nudgesThisSession: number;
  nudged: string[];
  secondsSinceNudge: number;
  daysSinceDismiss: number;
  dismissals: number;
  exitIntent: boolean;
};

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** The area (community first, else city) they keep returning to. */
function topArea(listings: ViewedListing[], communities: Profile["communities"]): AreaCount | null {
  const counts = new Map<string, AreaCount>();
  const bump = (key: string, label: string, kind: AreaCount["kind"]) => {
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { key, label, kind, count: 1 });
  };
  for (const l of listings) {
    if (l.communitySlug && l.communityName) bump(`c:${l.communitySlug}`, l.communityName, "community");
    else if (l.city) bump(`city:${l.city}`, l.city, "city");
  }
  for (const c of communities) bump(`c:${c.slug}`, c.name, "community");
  const ranked = [...counts.values()].sort((a, b) => b.count - a.count);
  return ranked[0] ?? null;
}

export function computeSignals(opts: {
  dwellSeconds: number;
  currentListing?: ViewedListing | null;
  identified: boolean;
  exitIntent?: boolean;
}): Signals {
  const p = getProfile();
  const s = getSession();
  const recent = p.listings.slice(0, 10);
  const prices = recent.map((l) => l.price).filter((n) => n > 0);
  const beds = recent.map((l) => l.beds).filter((n) => n > 0);
  const sessionListingViews = p.listings.filter((l) => l.at >= s.startedAt).length;

  return {
    sessions: p.sessions,
    repeatVisitor: p.sessions >= 2,
    listingViews: p.listings.length,
    sessionListingViews,
    topArea: topArea(p.listings, p.communities),
    areasSeen: new Set(p.listings.map((l) => l.communitySlug || l.city)).size,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    medianPrice: median(prices),
    typicalBeds: beds.length ? median(beds) : null,
    searches: p.searches.length,
    sellerSignals: p.sellerSignals,
    pageViews: p.pageViews,
    sessionSeconds: Math.round((Date.now() - s.startedAt) / 1000),
    dwellSeconds: opts.dwellSeconds,
    currentListing: opts.currentListing ?? null,
    lastListing: p.listings[0] ?? null,
    identified: opts.identified,
    converted: p.converted,
    nudgesThisSession: s.nudges,
    nudged: p.nudged,
    secondsSinceNudge: p.lastNudgeAt ? Math.round((Date.now() - p.lastNudgeAt) / 1000) : Number.MAX_SAFE_INTEGER,
    daysSinceDismiss: p.lastDismissAt ? (Date.now() - p.lastDismissAt) / 86_400_000 : Number.MAX_SAFE_INTEGER,
    dismissals: p.dismissals,
    exitIntent: opts.exitIntent ?? false,
  };
}
