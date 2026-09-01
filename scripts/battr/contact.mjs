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

const first = (...values) => values.find((v) => v !== undefined && v !== null && v !== "");

/**
 * @param person   raw FUB person
 * @param touch    { lastOutbound, lastInbound } epoch ms from the activity index
 * @param stamps   custom-field API names we resolved, e.g. { atRiskSince: 'customBattrAtRiskSince' }
 */
export function normalizeContact(person, touch, stamps = {}) {
  const tags = Array.isArray(person.tags) ? person.tags : [];

  // "Last communication" is the most recent AGENT-INITIATED contact. We compute
  // it from the calls/texts/emails feed rather than trusting a CRM field, so an
  // inbound message from the lead can never look like the agent doing the work.
  const lastCommunication = touch?.lastOutbound
    ? new Date(touch.lastOutbound).toISOString()
    : first(person.lastCommunication, person.lastCommunicationAt, null);

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
    lead_bucket_id: person.leadBucketId ?? null,

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
        system_timeframeId: first(person.timeframeId, null),
        customBattrAtRiskSince: person[atRiskSinceKey] ?? null,
      },
    },

    // carried through for reporting and actions, not addressed by rules
    _raw: person,
    _touch: touch ?? { lastOutbound: 0, lastInbound: 0 },
  };
}
