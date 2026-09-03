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

const first = (...values) => values.find((v) => v !== undefined && v !== null && v !== "");

/**
 * @param person   raw FUB person
 * @param touch    { lastOutbound, lastInbound } epoch ms from the activity index
 * @param stamps   custom-field API names we resolved, e.g. { atRiskSince: 'customBattrAtRiskSince' }
 */
export function normalizeContact(person, touch, stamps = {}, { inboundCountsAsTouch = rules.inboundCountsAsTouch } = {}) {
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
  const lastTouchMs = Math.max(touch?.lastOutbound ?? 0, inbound);
  const lastCommunication = lastTouchMs ? new Date(lastTouchMs).toISOString() : null;

  const atRiskSinceKey = stamps.atRiskSince || "customBattrAtRiskSince";

  return {
    // identity
    id: person.id,
    crm_contact_exid: person.id,
    full_name: first(person.name, [person.firstName, person.lastName].filter(Boolean).join(" "), `#${person.id}`),

    // ownership
    owner_user_id: person.assignedUserId ?? null,
    owner_name: person.assignedTo ?? null,
    crm_pond_id: first(person.assignedPondId, person.pondId, null) ?? null,
    owner_group_ids: person.assignedUserGroupIds ?? person.groupIds ?? [],

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
    last_website_visit: first(person.lastVisit, person.lastWebsiteVisit, person.lastActivity, null),

    tags_array: tags,

    // The rule JSON addresses these by dotted path.
    custom_fields: {
      fub: {
        system_lastCommunication: lastCommunication,
        // The nurture lists branch on timeframe. FUB exposes it as a name on
        // some accounts and an id on others, so both are carried and the rules
        // match the name. `timeframeUnresolved` below drives a diagnostic — a
        // timeframe we can't read would silently empty four of the six lists.
        system_timeframe: first(person.timeframe, person.timeframeName, null),
        system_timeframeId: first(person.timeframeId, null) ?? null,
        customBattrAtRiskSince: person[atRiskSinceKey] ?? null,
      },
    },

    /** True when this contact is in a nurture stage but has no readable timeframe. */
    timeframeUnresolved:
      !first(person.timeframe, person.timeframeName, null) &&
      ["nurture", "spoke with customer"].includes(String(first(person.stage, person.stageName, "")).toLowerCase()),

    // carried through for reporting and actions, not addressed by rules
    _raw: person,
    _touch: touch ?? { lastOutbound: 0, lastInbound: 0 },
  };
}
