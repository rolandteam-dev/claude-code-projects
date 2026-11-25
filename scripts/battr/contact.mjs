/**
 * Normalizes a Follow Up Boss person into the field names the rule JSON uses.
 *
 * The rules are written against a mirrored CRM schema (`crm_stage_exid`,
 * `crm_pond_id`, `custom_fields.fub.system_lastCommunication`, …) rather than
 * against raw FUB payloads. Normalizing here means the list configs can be
 * pasted in verbatim from the live system and still evaluate correctly.
 *
 * FUB is inconsistent about field names across account configurations, so each
 * mapping tries several candidates rather than trusting one.
 */

import { bucketForSource } from "./sources.mjs";
import { rules } from "./rules.mjs";
import { TIMEFRAME_IDS } from "./lists.mjs";
import { PAUSED_GROUP_MARKER } from "./paused.mjs";
import {
  profileTouchAt,
  latestProfileTouchAt,
  STAGE_UPDATED_FIELDS,
  TIMEFRAME_UPDATED_FIELDS,
  FUB_EMAIL_FIELDS,
} from "./communication.mjs";

/** Shared so the default never becomes a per-call allocation in a 54k loop. */
const EMPTY_SET = new Set();

/** Resolve FUB's numeric timeframe id to the band name the nurture lists match on. */
const resolveTimeframe = (person) => {
  const id = person.timeframeId;
  if (id === null || id === undefined || id === "") return null;
  return TIMEFRAME_IDS[id] ?? null;
};

const first = (...values) => values.find((v) => v !== undefined && v !== null && v !== "");

/**
 * Is the "At Risk Since" warning still the warning for THIS stretch of silence?
 *
 * The stamp is written once and never cleared. If the agent worked the lead after it was
 * warned, that warning belongs to an earlier stretch: when the lead goes quiet again it
 * must be warned again, not swept on the strength of a stamp from months ago.
 *
 * A stamp is a date ("2026-11-22"), written by the run that audits as of 7 PM PT that
 * day, so a touch counts as AFTER it only once it is later than that moment. Anything
 * unreadable is treated as not current: the safe direction is another warning, never a
 * sweep nobody was told about.
 *
 * @param stamp        the raw stamp value ("2026-11-22" or a full timestamp)
 * @param lastTouchMs  the lead's latest agent touch, in ms (0/null when none)
 */
export function warningIsCurrent(stamp, lastTouchMs) {
  if (stamp === null || stamp === undefined || stamp === "") return false;
  const text = String(stamp).trim();
  let stampedAt = Date.parse(text);
  if (!Number.isFinite(stampedAt)) return false;
  // Date-only stamp: the audit instant is 7 PM Pacific that day, i.e. 02:00-03:00 UTC the
  // next day. 27 hours past midnight UTC covers it with the later (standard-time) bound.
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) stampedAt += 27 * 3600 * 1000;
  return !(Number.isFinite(lastTouchMs) && lastTouchMs > stampedAt);
}

/**
 * @param person   raw FUB person
 * @param touch    { lastOutbound, lastInbound } epoch ms from the activity index
 * @param stamps   custom-field API names we resolved, e.g. { atRiskSince: 'customBattrAtRiskSince' }
 */
export function normalizeContact(
  person,
  touch,
  stamps = {},
  { inboundCountsAsTouch = rules.inboundCountsAsTouch, pausedOwnerIds = EMPTY_SET } = {}
) {
  const tags = Array.isArray(person.tags) ? person.tags : [];

  // "Last communication" is a CALL or a TEXT, in either direction.
  //
  // Email is deliberately excluded, per Mike: Follow Up Boss makes mass email
  // trivial, so one blast to five hundred leads would mark every one of them as
  // worked and the audit would find nothing. A metric that easy to satisfy
  // measures nothing.
  //
  // FUB's own `lastCommunication` field is NOT used as a fallback for the same
  // reason — it counts email, and there is no way to tell from it which channel
  // it came from.
  //
  // Inbound calls and texts DO count (`inboundCountsAsTouch`). A lead phoning
  // in is a live conversation whichever side dialled, and sweeping it away from
  // the agent holding it would be worse than doing nothing. The lead who calls
  // and is never called back is caught by the report's unanswered-inbound
  // section instead — visible, rather than swept or hidden.
  const inbound = inboundCountsAsTouch ? (touch?.lastInbound ?? 0) : 0;

  // Battr counts a stage advance and a timeframe change as working the lead,
  // and neither is a message — they live on the person record, not in any
  // communication endpoint. A null here means FUB carries no such timestamp on
  // this account, which the run reports rather than treating as "never".
  const profileTouch = rules.stageOrTimeframeUpdateCountsAsTouch
    ? Math.max(
        profileTouchAt(person, STAGE_UPDATED_FIELDS) ?? 0,
        profileTouchAt(person, TIMEFRAME_UPDATED_FIELDS) ?? 0
      )
    : 0;

  // Follow Up Boss's own last-email dates. See FUB_EMAIL_FIELDS: they separate the
  // leads Battr flags from the ones it leaves alone better than any other field,
  // and they do not count drips.
  const emailFields = inboundCountsAsTouch ? FUB_EMAIL_FIELDS : ["lastSentEmail"];
  const emailActivity = rules.fubEmailActivityCountsAsTouch ? (latestProfileTouchAt(person, emailFields) ?? 0) : 0;

  // A reactivated Ylopo lead's inbox-app message, which Battr counts as work on
  // that tag alone. See rules.ylopoReactivatedInboxCountsAsTouch.
  const ylopoTag = String(rules.ylopoReactivatedTag ?? "").toLowerCase();
  const ylopoActivity =
    rules.ylopoReactivatedInboxCountsAsTouch && ylopoTag && tags.some((t) => String(t).toLowerCase() === ylopoTag)
      ? (profileTouchAt(person, ["lastSentInboxAppMessage"]) ?? 0)
      : 0;

  const otherTouch = Math.max(touch?.lastOutbound ?? 0, inbound, profileTouch);
  const lastTouchMs = Math.max(otherTouch, emailActivity, ylopoActivity);
  const lastCommunication = lastTouchMs ? new Date(lastTouchMs).toISOString() : null;
  // Reported, so a silent no-op here cannot hide: how many leads this field is what saves.
  const touchVia =
    ylopoActivity && ylopoActivity > Math.max(otherTouch, emailActivity)
      ? "ylopo inbox"
      : emailActivity && emailActivity > otherTouch
        ? "fub email"
        : null;

  const atRiskSinceKey = stamps.atRiskSince || "customBattrAtRiskSince";
  const rawStamp = person[atRiskSinceKey] ?? null;
  // The stamp the rules see: only a warning that is still current for this stretch of silence.
  const currentStamp = warningIsCurrent(rawStamp, lastTouchMs) ? rawStamp : null;

  return {
    // identity
    id: person.id,
    crm_contact_exid: person.id,
    full_name: first(person.name, [person.firstName, person.lastName].filter(Boolean).join(" "), `#${person.id}`),

    // ownership
    owner_user_id: person.assignedUserId ?? null,
    owner_name: person.assignedTo ?? null,
    crm_pond_id: first(person.assignedPondId, person.pondId, null) ?? null,
    /**
     * NOT read from the person. Follow Up Boss returns neither
     * `assignedUserGroupIds` nor `groupIds`, so this was `[]` on every lead and
     * `[] DOES NOT CONTAIN ANY [52555]` was true for everybody — the exclusion
     * matched nobody while Battr's rule screen showed it active.
     *
     * Team membership belongs to the AGENT. `pausedOwnerIds` is resolved once
     * per run from /v1/teams and the marker is stamped here, so the rule JSON
     * pasted from Battr keeps matching without being rewritten to fit us.
     *
     * The FUB fields are still read first on the chance an account does return
     * them; on this one they never do.
     */
    owner_group_ids:
      person.assignedUserGroupIds ??
      person.groupIds ??
      (pausedOwnerIds.has(person.assignedUserId) ? [PAUSED_GROUP_MARKER] : []),

    // pipeline
    crm_stage_exid: first(person.stageId, person.stage_id, null) ?? null,
    stage_name: first(person.stage, person.stageName, "") ?? "",

    // provenance
    source_raw: first(person.source, person.sourceName, "") ?? "",
    source_normalized: first(person.source, person.sourceName, "") ?? "",
    // FUB has no lead-bucket field — it's a Battr concept. We resolve it from
    // the source string, which is what makes the combined list's
    // `lead_bucket_id != 82` exclusion actually exclude anything.
    lead_bucket_id: person.leadBucketId ?? bucketForSource(first(person.source, person.sourceName, "")),

    // timestamps the day_since transforms read
    crm_created_at: first(person.created, person.createdAt, null),
    last_activity_at: first(person.lastActivity, person.lastActivityAt, null),
    last_communication_at: lastCommunication,
    touch_via: touchVia,
    /**
     * A WEBSITE VISIT, not any activity. The fallback to `lastActivity` used to
     * be here and it made "visited the site in the last 10 days" mean "did
     * anything at all in the last 10 days" — which is nearly everyone. Active
     * Leads came back 8,083 against Battr's 131, a sixty-fold overcount, from
     * one plausible-looking fallback.
     *
     * If FUB returns no visit timestamp the condition should select nobody and
     * say so, rather than quietly select everybody.
     */
    last_website_visit: first(person.lastVisit, person.lastWebsiteVisit, null),

    tags_array: tags,

    // The rule JSON addresses these by dotted path.
    custom_fields: {
      fub: {
        system_lastCommunication: lastCommunication,
        // The nurture lists branch on timeframe, and match on the NAME.
        //
        // This account returns no `timeframe` field on the person — only
        // `timeframeId` — so reading the name alone found nobody and silently
        // emptied four of the six member lists. The id is resolved through
        // TIMEFRAME_IDS, which is FUB's own /timeframes table rather than a
        // guess at what the numbers mean. An id outside that table stays
        // unresolved and shows up in the diagnostic rather than being invented.
        system_timeframe: first(person.timeframe, person.timeframeName, resolveTimeframe(person), null),
        system_timeframeId: first(person.timeframeId, null) ?? null,
        customBattrAtRiskSince: currentStamp,
      },
    },

    /**
     * True when this contact is in a nurture stage but has no readable
     * timeframe — blank, or an id that is not in FUB's own table. Blank is a
     * data gap someone can fill in; an unknown id is a mapping we need to
     * extend, and conflating the two hides the second.
     */
    timeframeUnresolved:
      !first(person.timeframe, person.timeframeName, resolveTimeframe(person), null) &&
      ["nurture", "spoke with customer"].includes(String(first(person.stage, person.stageName, "")).toLowerCase()),

    /** An id FUB gave us that TIMEFRAME_IDS does not cover. Drives a loud diagnostic. */
    timeframeIdUnknown:
      person.timeframeId !== null &&
      person.timeframeId !== undefined &&
      TIMEFRAME_IDS[person.timeframeId] === undefined,

    /** A stamp exists but the agent worked the lead after it: the lead needs a fresh warning. */
    staleWarning: Boolean(rawStamp) && !currentStamp,

    // carried through for reporting and actions, not addressed by rules
    _raw: person,
    _touch: touch ?? { lastOutbound: 0, lastInbound: 0 },
  };
}
