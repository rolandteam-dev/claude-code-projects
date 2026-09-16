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

/**
 * Timeframe id → name, READ FROM FUB rather than inferred.
 *
 * The person payload carries no `timeframe` field at all — `inspect-fub-fields`
 * on 12 Sep 2026 confirmed it absent across a 40-person sample, with
 * `timeframeId` present on 12 of the 40. So the four nurture lists, which match
 * on the NAME, were matching nobody: 1,262 leads Battr audits nightly and we
 * did not see. That is the whole of the population gap.
 *
 * `GET /v1/timeframes` returns the account's own lookup table, verbatim:
 *
 *     {"id":1,"timeframe":"0-3 Months"}
 *     {"id":2,"timeframe":"3-6 Months"}
 *     {"id":3,"timeframe":"6-12 Months"}
 *     {"id":4,"timeframe":"12+ Months"}
 *     {"id":5,"timeframe":"No Plans"}
 *
 * Ids 1–4 land on TIMEFRAMES above by label, one to one. Id 5, "No Plans",
 * matches no nurture band — and matches none of Battr's four either, since its
 * lists are the same four bands. Such a lead is also not "no timeframe", so it
 * does not belong in CLEAN UP. It falls outside the audit in both systems, and
 * the census counts it as such rather than losing it.
 *
 * There is ALSO a `customTimeframe` text field on the account, labelled
 * "Timeframe". It is not returned on the person payload in the sample and is
 * not what the nurture bands read. If the People screen column is bound to it,
 * that explains the 514 the UI reported; it does not change the mapping here,
 * which is bound to the built-in id.
 */
export const TIMEFRAME_IDS = {
  1: "0-3 Months",
  2: "3-6 Months",
  3: "6-12 Months",
  4: "12+ Months",
  5: "No Plans",
};

const contact = (field, operator, value, extra = {}) => ({ object: "battr.contact", field, operator, value, ...extra });

const daysSince = (field, operator, value) =>
  contact(field, operator, value, { transform: { type: "days_since" }, value_data_type: "int" });

const LAST_COMM = "custom_fields.fub.system_lastCommunication";
const AT_RISK_SINCE = "custom_fields.fub.customBattrAtRiskSince";
const TIMEFRAME = "custom_fields.fub.system_timeframe";

const notInAPond = contact("crm_pond_id", "=", null, { value_data_type: "int" });

/**
 * Intent tags, read off Battr's rule screens on 3 Sep 2026.
 *
 * Both of these lists were modelled as SOURCE lists and are in fact TAG lists.
 * The difference is not cosmetic: a source records where a lead came from once
 * and never changes; these tags are set when the lead does something now. We
 * were reporting on every lead a vendor ever sent, which is why YLOPO came back
 * 2,389 against Battr's 127 and Zillow 2,344 against 43.
 */
const YLOPO_INTENT_TAGS = ["YPRIORITY", "HANDRAISER", "CALL_NOW=YES", "Y_SELLER_REPORT_ENGAGED", "Y_SELLER_REPORT_VIEWED"];
const ZILLOW_INTENT_TAGS = ["Zillow High Intent Buyer", "Zillow High Intent Seller", "Zillow High Intent"];

/** The live-business stages, as this account actually names them. */
const LIVE_BUSINESS_STAGES = ["Showing Homes", "Active Listing", "Listing Agreement", "Under Contract", "Submitting Offers"];

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
  // The warn-first interlock, read off Battr's own rule screens on 3 Sep 2026:
  // every nurture list's Neglected tier is
  //   `Last Communication Days Ago > N AND At Risk Notified Date Is Not Empty`.
  // It used to be missing here, which caused no extra sweeps — the sweep loop
  // enforces requireWarningBeforeSweep independently — but it did inflate the
  // Neglected count against Battr's, and a reconciliation that disagrees for a
  // known reason is worth less than one that agrees.
  neglected_filters: {
    groups: [[daysSince(LAST_COMM, ">", neglectedDays), contact(AT_RISK_SINCE, "!=", null, { value_data_type: "text" })]],
  },
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
    // Same interlock as the nurture lists — confirmed on the rule screen 3 Sep 2026.
    neglected_filters: {
      groups: [[daysSince(LAST_COMM, ">", 13), contact(AT_RISK_SINCE, "!=", null, { value_data_type: "text" })]],
    },
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
    observed: { date: "2026-09-03", total: 3332, compliant: 356, at_risk: 2, neglected: 2974 },
    // CORRECTED from Battr's rule screen, 3 Sep 2026. We had modelled this as a
    // SOURCE list (SOI, Sphere, Past Client, Referral, …) with 90/93 thresholds,
    // reverse-engineered from the compliance split. Both were wrong: it is a
    // STAGE list, and the thresholds are 93/96. The population came out roughly
    // the right size for the wrong reason, which is exactly why a guess that
    // reconciles is not the same as a guess that is correct.
    // 11% compliant / 0% at risk / 89% neglected. A 3-record at-risk band across
    // 3,333 leads means a long threshold with the usual narrow gap — a quarterly
    // touch, not a weekly one.
    list_filters: {
      groups: [
        [
          contact("stage_name", "IS ANY OF", ["Sphere", "Closed"], { value_data_type: "text" }),
          notInAPond,
        ],
      ],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 93)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 96)]] },
  },

  {
    id: 1147,
    name: "‼️ YLOPO IMPORTANT",
    audit_type: "contact_list",
    is_active: true,
    report_only: true,
    observed: { date: "2026-09-03", total: 116, compliant: 64, at_risk: 8, neglected: 44 },
    // CORRECTED from Battr's rule screen, 3 Sep 2026. We had modelled this on the
    // Ylopo SOURCE and guessed 7/10 from the compliance split. It is neither: the
    // list keys on Ylopo's INTENT TAGS, and the thresholds are 30/60.
    //
    // The distinction matters more than the numbers. Source says where a lead
    // came from once; these tags say the lead just did something — raised a
    // hand, asked to be called now, opened the seller report. This is an intent
    // list wearing a source list's name, and we were reporting on everyone Ylopo
    // ever sent us instead of the handful currently signalling.
    // 58% compliant says this population is actively worked, so the threshold is
    // short. MATCHES ANY is a substring test, so every current Ylopo source
    // (Ylopo, Ylopo Seller, Ylopo LSA, Ylopo Adwords, Open House (Ylopo)) is
    // covered and a new one needs no edit. CONTAINS ANY would compare whole
    // values and match none of them.
    list_filters: {
      groups: [
        [
          notInAPond,
          contact("tags_array", "CONTAINS ANY", YLOPO_INTENT_TAGS, { value_data_type: "text" }),
        ],
      ],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 30)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 60)]] },
  },

  {
    id: 1148,
    name: "🏹 Zillow Important",
    audit_type: "contact_list",
    is_active: true,
    report_only: true,
    observed: { date: "2026-09-03", total: 44, compliant: 16, at_risk: 2, neglected: 26 },
    // CORRECTED from Battr's rule screen, 3 Sep 2026. Same story as YLOPO: we had
    // it as a Zillow SOURCE list; it is a Zillow HIGH-INTENT TAG list, and it
    // carries two conditions we had no way to guess — leads already in the
    // live-business stages are excluded, and the lead must have been active on
    // the site in the last fortnight. Our 5/8 thresholds were right.
    // Substring again: Zillow, Zillow.com, Zillow Flex, Zillow Preferred,
    // Zillow Home Loans, Zillow-Long Form, Zillowlongform and the rest.
    list_filters: {
      groups: [
        [
          contact("tags_array", "CONTAINS ANY", ZILLOW_INTENT_TAGS, { value_data_type: "text" }),
          contact("stage_name", "IS NONE OF", LIVE_BUSINESS_STAGES, { value_data_type: "text" }),
          daysSince("last_activity_at", "<", 14),
          notInAPond,
        ],
      ],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 5)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 8)]] },
  },

  {
    id: 1149,
    name: "📖 Current & Upcoming Clients",
    audit_type: "contact_list",
    is_active: true,
    report_only: true,
    observed: { date: "2026-09-03", total: 451, compliant: 176, at_risk: 4, neglected: 271 },
    // CORRECTED from Battr's rule screen, 3 Sep 2026. We had guessed the stage
    // names — Active Client, Pending, Current Client, Upcoming Client, none of
    // which exist in this account — and used 14/30 as an admitted placeholder.
    // The real list runs the whole live-business pipeline on a 10/13 clock, the
    // same clock as Warm Back Up.
    // The one list on Battr's audits screen we had never seen. It is not a
    // member of Team Leads, so it cannot sweep — and its population is live and
    // closed business, every stage of which is already on rules.protectedStages.
    // Those two facts are independent, which is the point: a lead here is
    // protected by the list not acting AND by the stage exclusion, so no single
    // change can put a client under contract into a pond.
    //
    // Thresholds are a placeholder. A client relationship going quiet is worth
    // reporting on, but we have no rule screen for it and no basis for a number.
    list_filters: {
      groups: [
        [
          contact("stage_name", "IS ANY OF", ["Submitting Offers", "Showing Homes", "Listing Agreement", "Active Listing", "Under Contract", "Appointment Set", "Met with Customer"], { value_data_type: "text" }),
          notInAPond,
        ],
      ],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 10)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 13)]] },
  },

  // ─── The list we could never model, now read off the rule screen ───────────
  {
    id: 1150,
    name: "🎤 AI TEXT REPLIES",
    audit_type: "contact_list",
    is_active: true,
    report_only: true,
    observed: { date: "2026-09-03", total: 10, compliant: 8, at_risk: 0, neglected: 2 },
    // Previously marked "needs-rules": guessing a selector for nine leads was
    // not worth the risk of guessing wrong. The rule screen settles it — these
    // are leads the AI texter has engaged or flagged for follow-up. Reported,
    // never actioned. Fourteen of Battr's fifteen audits are now modelled;
    // only Database Health Score, a 13-source roll-up, still has no rule.
    list_filters: {
      groups: [
        [
          notInAPond,
          contact("tags_array", "CONTAINS ANY", ["AI_ENGAGED", "AI_NEEDS_FOLLOW_UP"], { value_data_type: "text" }),
        ],
      ],
    },
    at_risk_filters: { groups: [[daysSince(LAST_COMM, ">", 30)]] },
    neglected_filters: { groups: [[daysSince(LAST_COMM, ">", 60)]] },
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
    observed: { date: "2026-09-03", total: 131, compliant: 67, at_risk: 18, neglected: 46 },
    // Stage list CORRECTED from Battr's rule screen, 3 Sep 2026. We had it as
    // early-pipeline plus nurture; the real list is Attempted Contact, Lead,
    // Spoke with Customer, Sphere and Closed — no Nurture at all, and it reaches
    // the whole way into closed business. Anyone who came back to the site in
    // the last ten days, whatever they are to us now.
    list_filters: {
      groups: [
        [
          contact("stage_name", "IS ANY OF", ["Attempted Contact", "Lead", "Spoke with Customer", "Sphere", "Closed"], { value_data_type: "text" }),
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
