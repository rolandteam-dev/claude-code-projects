/**
 * When the concierge speaks first.
 *
 * Pure rules over the signals in `behavior.ts` — no DOM, no storage — so the
 * thresholds are easy to read, tune, and reason about. Each rule fires at most
 * once per visitor (by id), and the caps below stop the widget from ever
 * feeling like a pop-up ad.
 *
 * Dial the whole system up or down with NEXT_PUBLIC_CONCIERGE_AGGRESSION =
 * "gentle" | "balanced" | "assertive" (default "balanced").
 */

import type { Signals, ViewedListing } from "./behavior";

export type Aggression = "gentle" | "balanced" | "assertive";

export type Tuning = {
  /** seconds on one listing before we offer a tour */
  dwellSeconds: number;
  /** homes opened before we treat them as actively shopping */
  listingViews: number;
  /** most proactive messages in a single visit */
  maxPerSession: number;
  /** quiet period between proactive messages */
  minGapSeconds: number;
  /** after two dismissals, stay quiet this many days */
  dismissCooldownDays: number;
  /** open the full chat panel instead of a small teaser bubble */
  autoOpen: boolean;
  /** offer to help when they move to leave the page */
  exitIntent: boolean;
};

export const TUNING: Record<Aggression, Tuning> = {
  gentle: {
    dwellSeconds: 150,
    listingViews: 4,
    maxPerSession: 1,
    minGapSeconds: 300,
    dismissCooldownDays: 14,
    autoOpen: false,
    exitIntent: false,
  },
  balanced: {
    dwellSeconds: 75,
    listingViews: 3,
    maxPerSession: 2,
    minGapSeconds: 150,
    dismissCooldownDays: 7,
    autoOpen: false,
    exitIntent: true,
  },
  assertive: {
    dwellSeconds: 40,
    listingViews: 2,
    maxPerSession: 3,
    minGapSeconds: 75,
    dismissCooldownDays: 2,
    autoOpen: true,
    exitIntent: true,
  },
};

function resolveAggression(): Aggression {
  const raw = process.env.NEXT_PUBLIC_CONCIERGE_AGGRESSION;
  return raw === "gentle" || raw === "assertive" || raw === "balanced" ? raw : "balanced";
}

export const AGGRESSION = resolveAggression();
export const CONFIG = TUNING[AGGRESSION];

/* ------------------------------------------------------------------ */

export type NudgeAction = "tour" | "similar" | "connect" | "value" | "dismiss";
export type NudgeChip = { label: string; action: NudgeAction };

export type Nudge = {
  id: string;
  /** what the concierge says, unprompted */
  message: string;
  chips: NudgeChip[];
  /** high-intent enough to notify the team the moment it's engaged */
  hot: boolean;
  /** tags for the CRM lead/event */
  tags: string[];
  /** short criteria summary that rides along to the CRM */
  context: string;
  /** the home in front of them, when the nudge is about one */
  listing?: ViewedListing | null;
  /** ready-made chat message for the "show me similar homes" chip */
  similar?: string;
};

const compact = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : `$${Math.round(n / 1000)}K`;

/** "4-bed homes in Henderson around $1.4M" — used in copy and on the CRM record. */
export function criteriaSummary(s: Signals): string {
  const bits: string[] = [];
  if (s.typicalBeds) bits.push(`${s.typicalBeds}-bed`);
  bits.push("homes");
  if (s.topArea) bits.push(`in ${s.topArea.label}`);
  if (s.medianPrice) bits.push(`around ${compact(s.medianPrice)}`);
  return bits.join(" ");
}

/** The message we send into the chat when they ask for more like these. */
export function similarQuery(s: Signals): string {
  const parts: string[] = ["Show me homes like the ones I've been viewing"];
  if (s.typicalBeds) parts.push(`${s.typicalBeds}+ bedrooms`);
  if (s.topArea) parts.push(`in ${s.topArea.label}`);
  if (s.medianPrice) {
    const lo = Math.round((s.medianPrice * 0.8) / 25_000) * 25_000;
    const hi = Math.round((s.medianPrice * 1.2) / 25_000) * 25_000;
    parts.push(`between ${compact(lo)} and ${compact(hi)}`);
  }
  return `${parts[0]}: ${parts.slice(1).join(", ") || "similar homes"}.`;
}

const TOUR_CHIPS: NudgeChip[] = [
  { label: "Yes — set up a tour", action: "tour" },
  { label: "Show me similar homes", action: "similar" },
  { label: "Not right now", action: "dismiss" },
];

type Rule = { id: string; test: (s: Signals, c: Tuning) => Nudge | null };

/**
 * Evaluated in order — the first match wins, so the most specific, highest
 * intent moments sit at the top.
 */
const RULES: Rule[] = [
  {
    // Sitting on one home is the strongest buying signal on the site.
    id: "dwell-on-listing",
    test: (s, c) => {
      if (!s.currentListing || s.dwellSeconds < c.dwellSeconds) return null;
      const l = s.currentListing;
      return {
        id: "dwell-on-listing",
        message: `You've been spending some time with ${l.street}. Would you like to walk through it in person? I can check which tour times are open this week — or pull up a few homes like it.`,
        chips: TOUR_CHIPS,
        hot: true,
        tags: ["Tour Interest", "AI Concierge"],
        context: `Spent ${Math.round(s.dwellSeconds / 15) * 15}s on ${l.street}, ${l.city} (${compact(l.price)})`,
        listing: l,
      };
    },
  },
  {
    // Several homes, one area — they've picked their neighborhood.
    id: "shopping-one-area",
    test: (s, c) => {
      if (s.listingViews < c.listingViews) return null;
      if (!s.topArea || s.topArea.count < 2) return null;
      return {
        id: "shopping-one-area",
        message: `I see ${s.topArea.label} keeps pulling you back. I can have the team line up a private tour of the best two or three fits — or show you others in that range that haven't hit the portals yet. Which sounds better?`,
        chips: TOUR_CHIPS,
        hot: true,
        tags: ["Actively Shopping", "AI Concierge"],
        context: `Viewed ${s.listingViews} homes, focused on ${s.topArea.label}${s.medianPrice ? ` around ${compact(s.medianPrice)}` : ""}`,
        listing: s.lastListing,
      };
    },
  },
  {
    // Came back on another day — intent that survived a night's sleep.
    id: "repeat-visitor",
    test: (s) => {
      if (!s.repeatVisitor || s.listingViews < 1) return null;
      return {
        id: "repeat-visitor",
        message: `Welcome back. You've had a few homes on your list${s.topArea ? ` in ${s.topArea.label}` : ""} — want me to have Mike's team set up tours of your favorites, or send you what's new since your last visit?`,
        chips: [
          { label: "Set up tours", action: "tour" },
          { label: "What's new?", action: "similar" },
          { label: "Not right now", action: "dismiss" },
        ],
        hot: true,
        tags: ["Return Visitor", "AI Concierge"],
        context: `Return visit #${s.sessions} — ${criteriaSummary(s)}`,
        listing: s.lastListing,
      };
    },
  },
  {
    // Searching hard but hasn't opened much — help them narrow it down.
    id: "repeat-search",
    test: (s) => {
      if (s.searches < 2 || s.listingViews >= 2) return null;
      return {
        id: "repeat-search",
        message: `You've run a few searches — I can save this one and send you new matches the moment they list, usually before they show up on the big portals. Want me to set that up?`,
        chips: [
          { label: "Yes, send me new matches", action: "connect" },
          { label: "Find me homes now", action: "similar" },
          { label: "Not right now", action: "dismiss" },
        ],
        hot: false,
        tags: ["Saved Search Interest", "AI Concierge"],
        context: `Ran ${s.searches} searches — ${criteriaSummary(s)}`,
      };
    },
  },
  {
    // Heading for the door with homes in their history.
    id: "exit-intent",
    test: (s, c) => {
      if (!c.exitIntent || !s.exitIntent || s.listingViews < 1) return null;
      const l = s.currentListing ?? s.lastListing;
      return {
        id: "exit-intent",
        message: `Before you go — I can put ${l ? l.street : "the homes you've looked at"} on the calendar for a private showing, or email you the full list with photos so it's waiting for you later.`,
        chips: [
          { label: "Schedule a showing", action: "tour" },
          { label: "Email me the list", action: "connect" },
          { label: "No thanks", action: "dismiss" },
        ],
        hot: true,
        tags: ["Exit Intent", "AI Concierge"],
        context: `Leaving after ${s.listingViews} home(s) — ${criteriaSummary(s)}`,
        listing: l,
      };
    },
  },
  {
    // Seller-side curiosity gets a valuation, never a tour pitch.
    id: "seller-curious",
    test: (s, c) => {
      if (s.sellerSignals < 1 || s.dwellSeconds < c.dwellSeconds) return null;
      return {
        id: "seller-curious",
        message: `Curious what your home would bring in today's market? Mike's team does a real, human valuation — comps, condition, and timing — not an automated guess. Want me to arrange one?`,
        chips: [
          { label: "Yes, value my home", action: "value" },
          { label: "Just browsing", action: "dismiss" },
        ],
        hot: true,
        tags: ["Seller Interest", "AI Concierge"],
        context: "Viewed home valuation pages",
      };
    },
  },
];

/** Caps and cooldowns — the difference between attentive and annoying. */
function suppressed(s: Signals, c: Tuning): boolean {
  if (s.nudgesThisSession >= c.maxPerSession) return true;
  if (s.secondsSinceNudge < c.minGapSeconds) return true;
  // Two "not now"s means back off for a while.
  if (s.dismissals >= 2 && s.daysSinceDismiss < c.dismissCooldownDays) return true;
  // Give every visitor a moment to land before saying anything.
  if (s.sessionSeconds < 15) return true;
  return false;
}

export function pickNudge(s: Signals, c: Tuning = CONFIG): Nudge | null {
  if (suppressed(s, c)) return null;
  for (const rule of RULES) {
    if (s.nudged.includes(rule.id)) continue;
    const nudge = rule.test(s, c);
    if (nudge) return nudge;
  }
  return null;
}
