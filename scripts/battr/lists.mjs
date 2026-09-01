/**
 * Audit list definitions — the real rule configurations.
 *
 * Each contact list answers three questions:
 *   list_filters       who is in this list
 *   at_risk_filters    of those, who is At Risk
 *   neglected_filters  of those, who is Neglected
 *
 * The six member lists form a graduated sequence: the hotter the lead, the less
 * silence it tolerates. Hot Leads warn after 2 quiet days, Quarterly Nurture
 * after 93. None of the six carries actions of its own — every note, sweep, and
 * alert lives on the combined `⭐️ Team Leads (Nudges & Sweeps)` list, which
 * pools all six and applies its own compliance actions on top.
 *
 * ── Two deliberate departures from the live config, both documented below ─────
 *
 * 1. FIELDS BY NAME, NOT EXTERNAL ID. The live rules address stages and
 *    timeframes by numeric CRM id (`crm_stage_exid IS ANY OF [98,2,99,10,8]`).
 *    Those id-to-name mappings were never supplied, and guessing them would fail
 *    silently — a wrong id simply matches nothing. Matching on the name FUB
 *    returns on the contact is verifiable at a glance and survives a re-import.
 *
 * 2. LIST IDS ARE POSITIONAL. `source_list_ids` is confirmed as
 *    [1104, 1106, 1107, 1108, 1109, 1144], and the six member lists are
 *    confirmed by name — but which id belongs to which name was never stated.
 *    Since all six are members, a mismatched pairing cannot change any
 *    classification; it would only mislabel a source chip in the report.
 */

/** FUB stage names the rules match on. Verify against /v1/stages. */
export const STAGES = {
  earlyPipeline: ["Lead", "Attempted Contact"],
  nurture: ["Nurture", "Spoke with Customer"],
  converted: ["Closed", "Under Contract"],
};

/** FUB timeframe values that drive the nurture cadence. Verify against a contact record. */
export const TIMEFRAMES = {
  months0to3: ["0-3 months", "0-3 Months", "0 - 3 months"],
  months3to6: ["3-6 months", "3-6 Months", "3 - 6 months"],
  months6to12: ["6-12 months", "6-12 Months", "6 - 12 months"],
  months12plus: ["12+ months", "12+ Months", "12 + months", "Over a year"],
};

const contact = (field, operator, value, extra = {}) => ({ object: "battr.contact", field, operator, value, ...extra });

const daysSince = (field, operator, value) =>
  contact(field, operator, value, { transform: { type: "days_since" }, value_data_type: "int" });

const LAST_COMM = "custom_fields.fub.system_lastCommunication";
const AT_RISK_SINCE = "custom_fields.fub.customBattrAtRiskSince";
const TIMEFRAME = "custom_fields.fub.system_timeframe";

const notInAPond = contact("crm_pond_id", "=", null, { value_data_type: "int" });

/** The nurture lists differ only by timeframe and thresholds. */
const nurtureList = ({ id, name, timeframe, atRiskDays, neglectedDays }) => ({
  id,
  name,
  audit_type: "contact_list",
  is_active: true,
  list_filters: {
    groups: [
      [
        contact("stage_name", "IS ANY OF", STAGES.nurture, { value_data_type: "text" }),
        contact(TIMEFRAME, "IS ANY OF", timeframe, { value_data_type: "text" }),
        notInAPond,
      ],
    ],
  },
  at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", atRiskDays)]] },
  neglected_filters: { groups: [[daysSince(LAST_COMM, ">", neglectedDays)]] },
});

export const lists = [
  {
    id: 1144,
    name: "🌶️ Hot Leads",
    audit_type: "contact_list",
    is_active: true,
    list_filters: {
      groups: [
        [
          daysSince("crm_created_at", "<", 10),
          contact("stage_name", "IS ANY OF", STAGES.earlyPipeline, { value_data_type: "text" }),
          contact("tags_array", "DOES NOT CONTAIN ANY", ["Import"], { value_data_type: "text" }),
          notInAPond,
        ],
      ],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 2)]] },
    // The only list whose neglected tier carries the interlock explicitly: a Hot
    // Lead can only be swept if a previous run already stamped it At Risk.
    neglected_filters: {
      groups: [[daysSince(LAST_COMM, ">", 4), contact(AT_RISK_SINCE, "!=", null, { value_data_type: "text" })]],
    },
  },

  {
    id: 1104,
    name: "🌤️ Warm Back Up",
    audit_type: "contact_list",
    is_active: true,
    // The mirror of Hot Leads: same stages, but older than 10 days.
    list_filters: {
      groups: [
        [
          daysSince("crm_created_at", ">", 10),
          contact("stage_name", "IS ANY OF", STAGES.earlyPipeline, { value_data_type: "text" }),
          notInAPond,
        ],
      ],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 10)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 13)]] },
  },

  nurtureList({ id: 1106, name: "🔥 Weekly Nurture", timeframe: TIMEFRAMES.months0to3, atRiskDays: 10, neglectedDays: 13 }),
  nurtureList({ id: 1107, name: "😎 Bi-Weekly Nurture", timeframe: TIMEFRAMES.months3to6, atRiskDays: 16, neglectedDays: 19 }),
  nurtureList({ id: 1108, name: "🌱 Monthly Nurture", timeframe: TIMEFRAMES.months6to12, atRiskDays: 33, neglectedDays: 36 }),
  nurtureList({ id: 1109, name: "👀 Quarterly Nurture", timeframe: TIMEFRAMES.months12plus, atRiskDays: 93, neglectedDays: 96 }),

  {
    id: 9001,
    name: "⭐️ Team Leads (Nudges & Sweeps)",
    audit_type: "combined_contact_lists",
    is_active: true,
    // Pool the six, then apply two exclusions: one lead bucket, and the paused
    // owner group whose leads are never swept.
    list_filters: {
      groups: [
        [
          { object: "battr.aida_lists", field: "source_list_ids", operator: "IS ANY OF", value: [1104, 1106, 1107, 1108, 1109, 1144], value_data_type: "integer" },
          contact("lead_bucket_id", "!=", 82, { object: "battr.lead_buckets", value_data_type: "integer" }),
          contact("owner_group_ids", "DOES NOT CONTAIN ANY", [52555], { value_data_type: "integer" }),
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

  // ─── NOT a member of Team Leads ────────────────────────────────────────────
  // ❗Active Leads is a real list with its own 6/9 thresholds, but it is NOT one
  // of the six that feed the sweep — it belongs to the Database Health Score
  // roll-up instead. It is defined here for reporting only. Adding it to
  // source_list_ids would sweep leads the live system never touches.
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 1105,
    name: "❗Active Leads",
    audit_type: "contact_list",
    is_active: false,
    list_filters: {
      groups: [
        [
          contact("stage_name", "IS ANY OF", [...STAGES.earlyPipeline, ...STAGES.nurture], { value_data_type: "text" }),
          daysSince("last_website_visit", "<", 10),
          notInAPond,
        ],
      ],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 6)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 9)]] },
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
