/**
 * Homeowner activity → Follow Up Boss.
 *
 * The reactivation product only works if what a homeowner does on our side
 * shows up on their FUB record, because that is what moves them into the
 * agents' saved calling filters. Engagement stored only in our own database is
 * invisible to the people who make the calls.
 *
 * Everything here posts to FUB's Events API (via sendFubLead), NOT a Note.
 * Notes do not drive activity-based filters or action plans; events do.
 *
 * FUB matches or creates the person from the email on the event, so no stored
 * FUB person id is required — which matters because homeowners who arrive
 * through the home-value funnel never have one.
 */
import { sendFubLead } from "@/lib/fub";
import type { Homeowner } from "./store";

export type HomeownerActivity =
  | "dashboard-view"
  | "repeat-viewer"
  | "home-value-request"
  | "unsubscribe"
  | "email-open"
  | "email-click";

/**
 * How each activity lands in FUB.
 *
 * `type` must be one of FUB's supported event types — an unrecognised type is
 * rejected outright. These are the types already in use elsewhere in this app,
 * so they are known-good. Tags are what the agents' saved filters key on;
 * change them here and the whole app follows.
 */
const ACTIVITY: Record<
  HomeownerActivity,
  { type: string; source: string; tags: string[]; label: string }
> = {
  "dashboard-view": {
    type: "General Inquiry",
    source: "Home Value Dashboard",
    tags: ["Homeowner Activity", "Dashboard View"],
    label: "Viewed their home value dashboard",
  },
  "repeat-viewer": {
    // A warmer signal than a single view — treat as seller intent so it can
    // drive the agents' seller filters and a proactive-call task.
    type: "Seller Inquiry",
    source: "Home Value Dashboard",
    tags: ["Homeowner Activity", "Repeat Viewer"],
    label: "Checked their home value on 3+ days in the last week — actively watching",
  },
  "home-value-request": {
    type: "Seller Inquiry",
    source: "Home Value Request",
    tags: ["Homeowner Activity", "Home Value Request"],
    label: "Requested their home value",
  },
  unsubscribe: {
    type: "General Inquiry",
    source: "Home Value Dashboard",
    tags: ["Homeowner Activity", "Unsubscribed"],
    label: "Unsubscribed from home value updates — do not email",
  },
  "email-open": {
    type: "General Inquiry",
    source: "Home Value Email",
    tags: ["Homeowner Activity", "Email Open"],
    label: "Opened a home value email",
  },
  "email-click": {
    type: "General Inquiry",
    source: "Home Value Email",
    tags: ["Homeowner Activity", "Email Click"],
    label: "Clicked through from a home value email",
  },
};

/**
 * True when none of `timestamps` falls on today's date (UTC).
 *
 * Dashboard views are the throttle case: a homeowner refreshing their page ten
 * times should be one signal to an agent, not ten, and FUB rate-limits per key.
 * One event per person per day keeps the record readable and the quota intact.
 */
export function isFirstToday(timestamps: string[] | undefined): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return !(timestamps ?? []).some((t) => typeof t === "string" && t.slice(0, 10) === today);
}

/** Send one homeowner activity event. Never throws — CRM trouble must not break a page. */
export async function sendHomeownerActivity(
  activity: HomeownerActivity,
  who: Pick<Homeowner, "email"> & Partial<Homeowner>,
  extra?: string,
): Promise<{ sent: boolean; reason?: string }> {
  if (!who.email) return { sent: false, reason: "missing_email" };
  const a = ACTIVITY[activity];
  try {
    return await sendFubLead({
      firstName: who.firstName,
      lastName: who.lastName,
      email: who.email,
      phone: who.phone,
      address: who.address,
      city: who.city,
      state: who.state,
      zip: who.zip,
      type: a.type,
      source: a.source,
      tags: a.tags,
      message: [a.label, extra].filter(Boolean).join("\n"),
    });
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}
