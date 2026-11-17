/**
 * Seller triage — sort your warmest homeowners into Ready / Review / Skip with a
 * relationship, a consent/DNC read, and a recommended FUB plan (Plan A–D from
 * docs/fub-action-plans.md). This is the Fello high-intent-seller sheet (the
 * migration playbook's Phase 5), built from the signals we already own:
 * engagement score, source, consent flags. READ-ONLY — pure derivation from a
 * Homeowner record; writes nothing.
 */
import { engagementScore, latestEstimate, type Homeowner } from "./store";
import { isEligible } from "./eligibility";

export type Relationship = "Past client" | "Sphere" | "Lead" | "Database";
export type Bucket = "ready" | "review" | "skip";

export type TriageRow = {
  token: string;
  name: string;
  email: string;
  phone?: string;
  city: string;
  zip: string;
  value: number;
  intent: number; // 0–100 engagement score
  views: number;
  lastActivity: string | null;
  relationship: Relationship;
  emailConsent?: boolean;
  callTextConsent?: boolean;
  dnc?: boolean;
  subscribed: boolean;
  recommendedPlan: string;
  bucket: Bucket;
  reason: string;
  fubPersonId?: string;
};

function relationshipOf(h: Homeowner): Relationship {
  const s = (h.source || "").toLowerCase();
  if (s.includes("past") || s.includes("client")) return "Past client";
  if (s.includes("sphere")) return "Sphere";
  if (s === "fub" || s === "import") return "Database";
  return "Lead"; // home-value, cash-offer, manual, seller, etc.
}

/** Does the source itself read as active seller intent? */
function sellerIntentSource(h: Homeowner): boolean {
  const s = (h.source || "").toLowerCase();
  return s.includes("cash") || s.includes("seller") || s.includes("list") || s.includes("cma");
}

function lastActivityOf(h: Homeowner): string | null {
  const lastView = h.views?.length ? [...h.views].sort().slice(-1)[0] : null;
  return lastView ?? h.lastEmailedAt ?? null;
}

/**
 * Derive the triage row. Buckets:
 *   skip   — can't/shouldn't nurture (ineligible, unsubscribed, declined email)
 *   ready  — act now (hot engagement, seller-intent source, or a fresh lead)
 *   review — keep warm (engaged → already in the digest; or dormant → reconnect)
 */
export function triageRow(h: Homeowner): TriageRow {
  const intent = engagementScore(h);
  const relationship = relationshipOf(h);
  const eligible = isEligible({ email: h.email, state: h.state, zip: h.zip });
  const emailOnly = h.dnc === true;

  let bucket: Bucket;
  let plan: string;
  let reason: string;

  if (!eligible) {
    bucket = "skip";
    plan = "—";
    reason = "Ineligible (out of area or bad email)";
  } else if (h.subscribed === false) {
    bucket = "skip";
    plan = "—";
    reason = "Unsubscribed";
  } else if (h.emailConsent === false) {
    bucket = "skip";
    plan = "—";
    reason = "Declined marketing email";
  } else {
    const recentView = intent >= 34; // the engagement score gives 34 for a view in the last 7 days
    const sellerIntent = sellerIntentSource(h);
    if (recentView || sellerIntent || relationship === "Past client") {
      bucket = "ready";
      plan = "Plan B — Seller Consultation / CMA";
      reason = recentView
        ? "Viewed their dashboard recently"
        : sellerIntent
          ? "Seller-intent source"
          : "Past client";
    } else if (intent > 0) {
      bucket = "review";
      plan = "Plan C — Nurture (already running)";
      reason = "Some engagement — in the value digest";
    } else if (relationship === "Lead") {
      bucket = "ready";
      plan = "Plan A — Home Valuation Lead";
      reason = "New lead, no engagement yet";
    } else {
      bucket = "review";
      plan = "Plan D — Reconnect";
      reason = "Dormant database contact";
    }
    if (emailOnly) plan += " · email-only (DNC)";
  }

  const est = latestEstimate(h);
  return {
    token: h.token,
    name: [h.firstName, h.lastName].filter(Boolean).join(" ") || "—",
    email: h.email,
    phone: h.phone,
    city: h.city,
    zip: h.zip,
    value: est?.value ?? 0,
    intent,
    views: h.views?.length ?? 0,
    lastActivity: lastActivityOf(h),
    relationship,
    emailConsent: h.emailConsent,
    callTextConsent: h.callTextConsent,
    dnc: h.dnc,
    subscribed: h.subscribed,
    recommendedPlan: plan,
    bucket,
    reason,
    fubPersonId: h.fubPersonId,
  };
}

const BUCKET_RANK: Record<Bucket, number> = { ready: 0, review: 1, skip: 2 };

/** Triage a set of homeowners, highest-intent Ready first. */
export function triage(homeowners: Homeowner[]): TriageRow[] {
  return homeowners
    .map(triageRow)
    .sort((a, b) => BUCKET_RANK[a.bucket] - BUCKET_RANK[b.bucket] || b.intent - a.intent);
}
