# FUB action plans — the seller nurture sequences (gap #4)

Tre's Fello→Lofty playbook rebuilds Fello's drip emails as **Follow Up Boss action
plans** (his "Plan A–D"), triggered by tags. RTello already **pushes the tags**;
this doc is the spec for the action plans you build **in FUB** to match his
sequences. No app code — FUB automations can't be created over the API, so these
are built once in FUB → Automations, keyed on the tags below.

> **Division of labor.** RTello already owns the *recurring homeowner value email*
> (Tre's "Plan C") — that's the warm-first digest. Do **not** rebuild Plan C as a
> FUB action plan or contacts get double-emailed. FUB owns the human-touch
> sequences (A, B, D) that RTello doesn't send.

## Tags RTello emits (reference)

These are written to FUB today by the routes/libs noted. Build your action-plan
triggers on these exact strings.

| Tag | When RTello adds it | Source |
| --- | --- | --- |
| `Home Value Request` | Someone requests their home value / starts a dashboard | `/api/homeowners/ingest`, `fubActivity` |
| `New Home-Value Lead` | Agent-alert signal on a brand-new home-value signup | `agentAlert` (`/api/homeowners/ingest`) |
| `Seller Lead` | Cash-offer request, seller inquiry | `/api/homeowners/cash-offer`, `/api/lead` callers |
| `Seller` | Seller tag that drives the auto home-report | `sellerAuto` (FUB-set; RTello reacts) |
| `Home Report Sent` | Seller home-report already mailed (idempotency claim) | `sellerAuto` |
| `Cash Offer` | Cash-offer form | `/api/homeowners/cash-offer` |
| `Requested CMA` / `List With Us` / `Equity Calculator` | High-intent seller actions (also fire the hot-lead agent alert) | `agentAlert` hot set |
| `Guaranteed Sale` | Guaranteed-sale landing page | `landingPageRules` |
| `Expired` | Expired-listing match in your database | `/admin/expireds` tag button |
| `Email Opt-In` | Lead ticked the ongoing-email checkbox | `/api/lead`, `/api/homeowners/cash-offer` |
| `Call/Text OK` | Lead ticked the call/text checkbox | `/api/lead`, `/api/homeowners/cash-offer` |
| `Homeowner Activity` + `Dashboard View` / `Email Click` / `Repeat Viewer` / `Unsubscribed` | Engagement events forwarded from the dashboard/emails | `fubActivity`, Resend webhook |
| `Seller Radar` + `Hot Seller` | High engagement score pushed from Seller Radar | `/api/admin/push-to-fub` |

## Consent gating (apply to every plan)

Tre's rule, enforced at the plan level since FUB does the calling/texting:

- **Any plan that calls or texts** must require the **`Call/Text OK`** tag and
  exclude anyone marked DNC / email-only. RTello stores `dnc` on the homeowner
  record (gap #1); in FUB, keep a `DNC` (or `Email Only`) tag and add it to every
  calling/texting plan's **exclusion** list.
- **Email-only plans** run for `Email Opt-In` **or** an existing relationship
  (past client / sphere). Don't cold-email a purchased/unconsented segment.
- **Stop every plan on `Unsubscribed`** (and on reply / appointment set), so a
  RTello unsubscribe or a human reply halts the automation.

## The four plans

### Plan A — Home Valuation Lead (email sequence + review task)
- **Trigger:** `Home Value Request` (or `New Home-Value Lead`).
- **Cadence:** email **day 0, day 7, day 21**, plus a task for the agent to review
  the valuation and reach out.
- **Note:** RTello already sends the *welcome* email on signup and the recurring
  value digest. Plan A is the **early human-touch layer** — keep its 3 emails
  short and personal (not another automated valuation), or make Plan A
  **task-only** (day 0/7/21 call tasks) and let RTello's emails carry the value
  content. Check overlap so the lead doesn't get a RTello email and a Plan A email
  the same day.

### Plan B — Seller Consultation / CMA (task-driven, fast response)
- **Trigger:** `Requested CMA`, `List With Us`, `Cash Offer`, or `Seller Lead`.
- **Flow:** **call/email task within the hour** → prep the CMA → schedule the
  consultation → follow-up tasks. These tags already fire RTello's hot-lead agent
  alert email, so Plan B is the structured follow-through behind that alert.

### Plan C — Seller Nurture for homeowners  ← **RTello owns this**
- ~6 monthly value-focused emails. **This is the RTello value digest.** Do not
  rebuild it in FUB. (If you want FUB to own it instead, turn the RTello digest
  off with `HOMEOWNER_DIGEST_ENABLED` — run exactly one of the two, never both.)

### Plan D — Seller Reconnect (warm past contacts)
- **Trigger:** a manual `Reconnect` tag (or a past-client/sphere smart list).
  RTello doesn't tag past clients automatically — apply this from your existing
  FUB segments.
- **Cadence:** 2 personal-style emails + a check-in task over ~2–3 weeks.

## Turn-on order (Tre's Phase 7 safety)

1. Build each plan as above, keyed on the tags.
2. **Check overlap** so nobody is in two plans sending the same day (esp. Plan A
   vs. the RTello digest / Plan C).
3. **Test with one brand-new fake contact** and one existing contact; confirm the
   right plan starts and consent exclusions hold.
4. Only then enable. Keep volume modest to protect the sending domain.
