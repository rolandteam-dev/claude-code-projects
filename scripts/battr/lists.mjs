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
 * pools them and applies its own compliance actions on top.
 *
 * Two further lists are audited and REPORTED but never actioned, mirroring how
 * Battr runs them: 1145 (nurtures with no timeframe) and 1105 (Active Leads).
 * Both are marked `report_only`. See docs/battr-observed-config.md for the live
 * numbers each one showed on 2 Sep 2026.
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
 *    [1104, 1106, 1107, 1108, 1109, 1144] (1145 is ours), and the six member
 *    lists are
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

  // ─── Battr runs this one; we mirror it ─────────────────────────────────────
  // Observed on the Aida Audits screen for 2 Sep 2026:
  //
  //   🗓️ CLEAN UP: Nurtures No Timeframe — 4,200 records
  //   211 compliant (5%) · 129 at risk (3%) · 3,860 neglected (92%)
  //
  // The four nurture lists above select BY timeframe, so a lead sitting in
  // Nurture with the field blank matches none of them. Battr catches that
  // population in this separate list, and so do we.
  //
  // NOT A MEMBER OF TEAM LEADS, and that is load-bearing. Team Leads holds 866
  // records; this list alone holds 4,200. It cannot be feeding it, so in Battr
  // this list carries no sweep — it computes a compliance state for reporting
  // and someone works the result by hand. Ours does the same: it is audited and
  // reported every night and never sweeps a thing. Adding 1145 to
  // `source_list_ids` would sweep 3,860 leads Battr has never touched.
  //
  // THRESHOLDS ARE INFERRED, not read off the rule screen. Every other list
  // Battr runs uses a 2–3 day gap between warn and sweep, and the narrow 3%
  // at-risk band here fits that shape. 10/13 mirrors Warm Back Up, the list
  // closest to this population. `observed` below turns the guess into a test:
  // the nightly report compares our split against Battr's, and a wide miss
  // means the thresholds are wrong rather than the data.
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 1145,
    name: "🗓️ CLEAN UP: Nurtures No Timeframe",
    audit_type: "contact_list",
    is_active: true,
    /** Audited and reported, never actioned. Mirrors Battr, where it feeds no combined list. */
    report_only: true,
    observed: { date: "2026-09-02", total: 4200, compliant: 211, at_risk: 129, neglected: 3860 },
    list_filters: {
      groups: [
        [
          contact("stage_name", "IS ANY OF", STAGES.nurture, { value_data_type: "text" }),
          contact(TIMEFRAME, "=", null, { value_data_type: "text" }),
          notInAPond,
        ],
      ],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 15)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 30)]] },
  },

  {
    id: 9001,
    name: "⭐️ Team Leads (Nudges & Sweeps)",
    audit_type: "combined_contact_lists",
    is_active: true,
    // Observed 2 Sep 2026: 866 records — 842 compliant (97%), 17 at risk (2%),
    // 7 neglected (1%). This is THE reconciliation number. Warm Back Up alone
    // shows 10,783 on the same screen, so the combined list sheds roughly 92%
    // of its members; in our model that is the lead-bucket exclusion plus the
    // protected-source check. If a dry run lands near 866, the model is right.
    observed: { date: "2026-09-02", total: 866, compliant: 842, at_risk: 17, neglected: 7 },
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

  // ─── Reported, never actioned. All mirror lists Battr runs. ────────────────
  //
  // None of these is a member of Team Leads, so none of them can sweep anything.
  // They exist so the nightly report covers what Battr's screen covers, and so a
  // list we are modelling wrongly shows up as a number that disagrees with
  // Battr's rather than as silence.
  //
  // POPULATIONS are inferred from each list's name plus our source map, which is
  // solid. THRESHOLDS are inferred from the compliance split Battr showed on
  // 2 Sep 2026, which is not. Every one is marked, and `observed` makes each
  // guess testable: the report prints ours beside Battr's every night.
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 1146,
    name: "💛 Sphere & Past Clients",
    audit_type: "contact_list",
    is_active: true,
    report_only: true,
    thresholds_inferred: true,
    observed: { date: "2026-09-02", total: 3333, compliant: 356, at_risk: 2, neglected: 2975 },
    // 11% compliant / 0% at risk / 89% neglected. A 3-record at-risk band across
    // 3,333 leads means a long threshold with the usual narrow gap — a quarterly
    // touch, not a weekly one.
    list_filters: {
      groups: [
        [
          contact("source_normalized", "IS ANY OF", ["SOI", "Sphere", "Past Client", "Referral", "Barrett Financial Referral"], { value_data_type: "text" }),
          notInAPond,
        ],
        [contact("stage_name", "IS ANY OF", ["Past Client"], { value_data_type: "text" }), notInAPond],
      ],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 90)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 93)]] },
  },

  {
    id: 1147,
    name: "‼️ YLOPO IMPORTANT",
    audit_type: "contact_list",
    is_active: true,
    report_only: true,
    thresholds_inferred: true,
    observed: { date: "2026-09-02", total: 127, compliant: 74, at_risk: 7, neglected: 46 },
    // 58% compliant says this population is actively worked, so the threshold is
    // short. Matched on the source prefix rather than a fixed list, so a new
    // Ylopo source is covered without an edit.
    list_filters: {
      groups: [[contact("source_normalized", "CONTAINS ANY", ["Ylopo"], { value_data_type: "text" }), notInAPond]],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 7)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 10)]] },
  },

  {
    id: 1148,
    name: "🏹 Zillow Important",
    audit_type: "contact_list",
    is_active: true,
    report_only: true,
    thresholds_inferred: true,
    observed: { date: "2026-09-02", total: 43, compliant: 14, at_risk: 5, neglected: 24 },
    list_filters: {
      groups: [[contact("source_normalized", "CONTAINS ANY", ["Zillow"], { value_data_type: "text" }), notInAPond]],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 5)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 8)]] },
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
    // Audited and reported, never actioned — the same shape as 1145. Observed
    // on 2 Sep 2026 at 135 records: 65 compliant (48%), 21 at risk (16%),
    // 49 neglected (36%).
    is_active: true,
    report_only: true,
    observed: { date: "2026-09-02", total: 135, compliant: 65, at_risk: 21, neglected: 49 },
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

/** Lists that are audited and reported every night but never trigger an action. */
export const reportOnlyLists = () => lists.filter((l) => l.report_only && l.is_active);

export const memberListsOf = (combined) => {
  const condition = combined.list_filters?.groups
    ?.flat()
    ?.find((c) => c.object === "battr.aida_lists" && c.field === "source_list_ids");
  const ids = Array.isArray(condition?.value) ? condition.value : [];
  return { ids, resolved: ids.map(listById).filter(Boolean), missing: ids.filter((id) => !listById(id)) };
};
