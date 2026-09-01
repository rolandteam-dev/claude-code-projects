/**
 * Audit list definitions — the real rule configurations, in the same JSON shape
 * the live system stores them in, so they can be pasted across verbatim.
 *
 * Each contact list answers three questions:
 *   list_filters       who is in this list
 *   at_risk_filters    of those, who is At Risk
 *   neglected_filters  of those, who is Neglected
 *
 * A combined list has no thresholds of its own. It unions the most recent run of
 * each member list, dedupes by contact, and each contact keeps its WORST status
 * across the member lists. That is why thresholds are per-list: a Hot Lead goes
 * At Risk after 2 quiet days while an Active Lead gets 6.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COVERAGE GAP — read before going live.
 * `⭐️ Team Leads (Nudges & Sweeps)` combines SIX member lists (ids 1104, 1106,
 * 1107, 1108, 1109, 1144). Only two of those rule sets were supplied. The other
 * four are marked below and must be exported from the Aida list editor before
 * this can be considered at parity — until then our audit sees a narrower
 * population than the live one, and will under-report.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Stage external ids referenced by the rules. Confirm against /v1/stages. */
export const STAGES = {
  converted: [8, 106], // Closed, Under Contract — what the KPIs count as converted
};

export const lists = [
  {
    id: 1104,
    name: "❗Active Leads",
    audit_type: "contact_list",
    is_active: true,
    // Active pipeline stages, seen on the website in the last 10 days, not parked in a pond.
    list_filters: {
      groups: [
        [
          { object: "battr.contact", field: "crm_stage_exid", operator: "IS ANY OF", value: [98, 2, 99, 10, 8], value_data_type: "int" },
          { object: "battr.contact", field: "last_website_visit", operator: "<", value: 10, transform: { type: "days_since" }, value_data_type: "int" },
          { object: "battr.contact", field: "crm_pond_id", operator: "=", value: null, value_data_type: "int" },
        ],
      ],
    },
    at_risk_filters: {
      groups: [
        [
          { object: "battr.contact", field: "custom_fields.fub.system_lastCommunication", operator: ">", value: 6, transform: { type: "days_since" }, value_data_type: "int" },
        ],
      ],
    },
    neglected_filters: {
      groups: [
        [
          { object: "battr.contact", field: "custom_fields.fub.system_lastCommunication", operator: ">", value: 9, transform: { type: "days_since" }, value_data_type: "int" },
        ],
      ],
    },
  },

  {
    id: 1144,
    name: "🌶️ Hot Leads",
    audit_type: "contact_list",
    is_active: true,
    list_filters: {
      groups: [
        [
          { object: "battr.contact", field: "crm_created_at", operator: "<", value: "10", transform: { type: "days_since" }, value_data_type: "int" },
          { object: "battr.contact", field: "crm_stage_exid", operator: "IS ANY OF", value: [2, 98], value_data_type: "text" },
          { object: "battr.contact", field: "tags_array", operator: "DOES NOT CONTAIN ANY", value: ["Import"], value_data_type: "text" },
          { object: "battr.contact", field: "crm_pond_id", operator: "=", value: null, value_data_type: "int" },
        ],
      ],
    },
    at_risk_filters: {
      groups: [
        [
          { object: "battr.contact", field: "custom_fields.fub.system_lastCommunication", operator: ">", value: "2", transform: { type: "days_since" }, value_data_type: "int" },
        ],
      ],
    },
    // The escalation pattern: a Hot Lead can only be swept if it was already
    // stamped At Risk on a previous run. This is the warn-first interlock.
    neglected_filters: {
      groups: [
        [
          { object: "battr.contact", field: "custom_fields.fub.system_lastCommunication", operator: ">", value: "4", transform: { type: "days_since" }, value_data_type: "int" },
          { object: "battr.contact", field: "custom_fields.fub.customBattrAtRiskSince", operator: "!=", value: null, value_data_type: "text" },
        ],
      ],
    },
  },

  // ─── MISSING MEMBER LISTS ──────────────────────────────────────────────────
  // Ids 1106, 1107, 1108, 1109 are members of Team Leads but their rule JSON was
  // not supplied. Export each from the Aida list editor and add it here in the
  // same shape. Leaving them out narrows the audited population.
  // ───────────────────────────────────────────────────────────────────────────

  {
    id: 9001,
    name: "⭐️ Team Leads (Nudges & Sweeps)",
    audit_type: "combined_contact_lists",
    is_active: true,
    // Union the member lists, then apply two exclusions: one lead bucket and one
    // owner group (the paused-agent group — their leads are not swept).
    list_filters: {
      groups: [
        [
          { object: "battr.aida_lists", field: "source_list_ids", operator: "IS ANY OF", value: [1104, 1106, 1107, 1108, 1109, 1144], value_data_type: "integer" },
          { object: "battr.lead_buckets", field: "lead_bucket_id", operator: "!=", value: 82, value_data_type: "integer" },
          { object: "battr.contact", field: "owner_group_ids", operator: "DOES NOT CONTAIN ANY", value: [52555], value_data_type: "integer" },
        ],
      ],
    },
    at_risk_filters: { groups: [] },
    neglected_filters: { groups: [] },

    at_risk_actions: [
      {
        action_name: "contact_note",
        configuration: {
          note_text: "This lead is at risk - reach out and keep them going! 🙌",
          notes_version: "v4",
          action_run_type: "automatic",
          day_filter: "Every Day",
          user_group_exclusion: 52555,
          lead_bucket_exclusion: 82,
        },
      },
    ],

    neglected_actions: [
      {
        action_name: "auto_sweep_to_pond",
        configuration: {
          tags: [],
          pond_id: "", // blank => resolved through the assignment rule set
          day_filter: "Weekdays Excluding Monday",
          action_run_type: "automatic",
          user_group_exclusion: 52555,
          lead_bucket_exclusion: 82,
          assignment_rule_set_id: 41,
        },
      },
    ],

    list_level_actions: [
      {
        action_name: "aida_actions_audit_alert",
        conditions_groups: [[]],
        configuration: {
          send_when: "any_non_compliant",
          day_filter: "Every Day",
          send_alerts_to: "agent",
          admin_recipients: [],
          admin_message: "At risk leads need to be worked ASAP or they will be swept to the pond.",
          user_group_exclusion: 52555,
        },
      },
    ],
  },
];

export const listById = (id) => lists.find((l) => l.id === id);

export const memberListsOf = (combined) => {
  const condition = combined.list_filters?.groups
    ?.flat()
    ?.find((c) => c.object === "battr.aida_lists" && c.field === "source_list_ids");
  const ids = Array.isArray(condition?.value) ? condition.value : [];
  return { ids, resolved: ids.map(listById).filter(Boolean), missing: ids.filter((id) => !listById(id)) };
};
