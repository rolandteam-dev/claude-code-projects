# DealDesk — Contract-to-Close Communication Platform

**Status:** plan, awaiting approval. No code written yet.
**Owner:** Mike Roland, The Roland Team (LPT Realty, Las Vegas/Henderson)
**Working branch:** `claude/lucid-dirac-hqzss3`

## Product thesis

Contract-extraction "AI TC" tools already exist (DocJacket, Trackxi, ListedKit).
We do not compete on contract reading. We win on **communication**: collecting
status from third parties who will never log into a portal, and turning it into
proactive plain-English updates for the client and risk alerts for the agent.
The Domino's pizza tracker for a home purchase.

Multi-tenant from day one: team -> agents -> deals. The Roland Team is tenant #1;
the product must work for any agent or team.

---

## A. Open questions

Each row lists the default that applies if the question goes unanswered.

| # | Question | Why it matters | Default |
|---|---|---|---|
| 1 | New repo, or this one? | This repo is the therolandteam.com marketing site. A multi-tenant SaaS holding other brokerages' client data should not share a codebase or database with it. | Scaffold under `apps/dealdesk/` on the working branch; move to its own repo before it touches real client data. |
| 2 | Product name + domain | The deal inbox is `<slug>@deals.<domain>` and that address lives in third-party sent-mail forever. Renaming later is painful. | **Blocked.** Placeholder env var until decided. Must be settled before Phase 4. |
| 3 | NVAR day-counting rules: calendar days from the day after acceptance? Expiry time of day? Do weekends/holidays roll? Current default periods for due diligence, appraisal, loan contingency, title docs, walkthrough? | Highest-risk logic in the product. A one-day error in a computed due-diligence deadline is real-money liability. | **Blocked.** Rules live in a config object; placeholders marked UNCONFIRMED. Every computed date is labeled "computed" vs "from contract" on the review screen. |
| 4 | 3-5 real signed NVAR RPAs, including one counter and one addendum that extends a deadline | Extraction accuracy is empirical. Counters and addenda are where extraction actually breaks. | **Blocked for Phase 1 quality.** Pipeline can be built against synthetic contracts but not tuned. |
| 5 | Whose deals does an agent see? Owner sees all? TC role? Agent-to-agent visibility? | Drives the permission model, expensive to retrofit. | `owner` and `admin` see all; `agent` sees own deals plus deals they are added to; `tc` sees assigned deals only. |
| 6 | Twilio account, and which legal entity registers the A2P brand? | 10DLC registration takes 1-3 weeks and gates all SMS. Must be the SaaS entity, not the brokerage, and never the title JV or lending business. | Registration checklist delivered in Phase 0; Mike starts it immediately in parallel. Needs legal name, EIN, address, website, public privacy policy + SMS terms page. |
| 7 | Client notification default channel, and auto-send vs approve-first as team default? | Onboarding friction and TCPA exposure. | Email auto-send + SMS approve-first, overridable per deal. Email has no 10DLC dependency, so the product is useful on day one. |
| 8 | Buy side only in Phase 1, or listing side too? | Seller side needs a different template (listing date, showings, offer review, disclosures). | Purchase side only. Template system is generic, so the listing template is a data change, not a code change. |
| 9 | Third-party SMS: how does first contact happen? | Cold-texting a lender a "Reply 1/2/3" menu with no prior relationship is bad UX and TCPA-risky. | Agent attests to a business relationship and captures the number; system sends one intro message; no menu until the recipient replies YES. |
| 10 | Will this ever be given free or discounted to anyone who sends title or lending business? | RESPA Section 8. Determines whether entitlement tracking must prove uniform pricing. | No. Uniform published pricing, no exceptions tied to title/lending volume. |

**Minimum to start Phase 0: #1, #2, #3.** (#3 can arrive by Phase 2.)

---

## B. Recommendations

| Choice | Recommendation | Reasoning |
|---|---|---|
| ORM | **Drizzle** | TypeScript-first, compiles to plain SQL over the `postgres.js` driver already used in this org, no query engine binary to cold-start on Vercel, migrations are reviewable `.sql` files. |
| Database | **Neon** (direct, not via Vercel marketplace) | Vercel Postgres is Neon underneath; going direct gets database branching per preview deploy and no data migration if we leave Vercel. |
| Inbound email | **Postmark inbound**, Resend stays for outbound | Inbound parsing is the load-bearing feature of the thesis. Postmark's inbound streams are mature: parsed MIME as JSON, attachments, spam score, signed webhooks, delivery replay. Two vendors is a real cost — if consolidating, use Resend inbound behind an adapter so switching is one file. |
| Auth | **Clerk** | Its Organizations primitive is the team->agent hierarchy, including invites, roles and org switching. NextAuth means hand-building all of it. `clerk_user_id` is stored in its own column so a swap is a migration, not a rewrite. |
| SMS | **Twilio + Messaging Service**, starting on a **toll-free number** | Toll-free verification clears faster than 10DLC brand+campaign, so the team can pilot while registration is pending. Messaging Service means numbers can be swapped without code changes. |
| AI — contract extraction | **`claude-opus-5`**, effort `high`, PDF as a `document` block, **citations enabled** | Accuracy carries licence risk and runs once per deal, so cost is irrelevant (est. $0.15-0.25 per contract). Citations return page number and the exact quoted sentence for each field — precisely what the review screen should show. |
| AI — inbound email triage | **`claude-opus-5`**, effort `low`, prompt caching on the system prompt | Est. $0.01-0.02 per email; ~30 emails a deal is ~$0.50. `claude-sonnet-5` is materially cheaper per token, but that quality/cost call should be made after seeing Opus proposals in Phase 4, not before. |
| Background jobs | **`jobs` table drained by a Vercel cron every minute**, plus Next 16 `after()` for fire-and-forget | No new vendor, survives deploys, retryable, and job rows double as a debugging trail. |
| File storage | **Vercel Blob**, private, server-issued signed URLs only | No contract PDF ever gets a permanent public URL. |
| Tenant isolation | **Postgres RLS** + a repository layer requiring `teamId` on every call | Holding other brokerages' client data. App-layer scoping alone means one forgotten `where` clause leaks a competitor's pipeline. |

### Known API constraint to resolve in Phase 1

The Anthropic API rejects combining citations with the structured-output format
parameter. Phase 1 opens with a spike: try citations + a strict tool schema
(expected to coexist); if not, fall back to the model quoting the source
sentence verbatim as a schema field. Either way the review screen shows
"here is the date, and here is the line in the contract it came from."

---

## C. Data model

Money is integer cents. Contract deadlines are `date` (a calendar day in
property-local time), never timestamps. Every tenant-scoped table carries
`team_id`.

### Tenancy and identity
- **`teams`** — name, slug, timezone, quiet-hours window, plan, settings
- **`users`** — `clerk_user_id`, email, name, phone
- **`team_members`** — team, user, role (`owner`/`admin`/`agent`/`tc`), status

### Contacts and parties
- **`contacts`** — team-scoped, reusable across deals (lenders and escrow officers repeat): kind, name, email, `phone_e164`, company
- **`deal_parties`** — joins contact to deal with a per-deal `role` (buyer, seller, listing_agent, loan_officer, escrow_officer, tc, inspector), `side` (ours/theirs), per-channel notify flags

### Consent — first class, append-only
- **`consent_records`** — contact, channel, status (`opted_in`/`opted_out`/`pending`), method (`web_form`/`agent_attested`/`reply_yes`), proof JSON (IP, user agent, exact text shown, capturing user), timestamps

Current state is the latest row. STOP writes a new row; nothing is ever mutated,
so consent at any point in time can be proven.

### Deals
- **`deals`** — owner, side, status, full property address + APN/MLS, price cents, EMD cents, acceptance date, COE date, contract form version, escrow number, `inbox_local_part` (unique), risk score/level, `last_activity_at`

### Documents and extraction — nothing auto-trusted
- **`documents`** — kind (purchase_agreement/counter/addendum), blob key, sha256, uploader, page count
- **`extractions`** — model, prompt version, schema version, raw output, normalized output, per-field confidence, per-field citation (page + quoted text), token usage, cost, status
- **`extraction_reviews`** — reviewer, accepted final values, `field_changes` diff of what the agent corrected

**Hard rule, enforced in the schema:** no row in `extractions` writes to `deals`
or `deal_dates` unless a matching `extraction_reviews` row exists. The
`field_changes` diff is also free training signal — after 50 deals we know
exactly which fields Claude gets wrong.

### Dates and milestones
- **`milestone_templates`** / **`milestone_template_steps`** — system defaults plus per-team overrides. Each step has a stable string `key` (`emd_received`, `clear_to_close`), label, order, category, default offset days, offset basis (`acceptance`/`coe`/another deadline), client-visible flag, separate client-facing label
- **`deal_milestones`** — per deal: key, status, due date, `due_date_source` (`contract`/`computed`/`manual`), completed_at, `completed_source` (`email`/`sms`/`manual`/`system`)
- **`deal_dates`** — contract deadlines, history-preserving via `superseded_by_id`, each linked to its source document. An addendum extending due diligence creates a new row; the old one stays, so "what was the deadline before the extension" is answerable a year later

**Milestone keys are storage keys — never renumber, never reuse.** (Same rule as
the portal task ids in this repo.)

### Communication
- **`email_messages`** — direction, provider message id (unique, for idempotency), threading headers, addresses, subject, bodies, spam score, raw MIME blob key
- **`email_attachments`**
- **`sms_messages`** — provider SID, direction, E.164 numbers, body, status, segments, cost
- **`status_requests`** — the reply-by-text core: deal, contact, prompt sent, and an options JSON mapping each reply key to a milestone key (`{"1": "appraisal_received", ...}`), plus expiry and state

The reply mapping is stored at send time, so a reply of "2" three days later is
interpreted against what was actually asked rather than re-guessed.

### Human-in-the-loop updates
- **`update_proposals`** — source (email/sms), proposed milestone changes, Claude's rationale, the exact quoted sentence that triggered it, confidence, state (`pending`/`approved`/`rejected`). One click approves; the change links back to the source message

### Audit — append-only, no updates, no deletes
- **`audit_events`** — entity, action, actor type (`user`/`system`/`ai`/`contact`), actor id, source (`manual`/`email`/`sms`/`extraction`/`cron`), source ref (which email/SMS/proposal), before/after JSON, IP, user agent

Every status change in the system writes one. This is the record shown when a
client says "you never told me."

### Client access
- **`client_links`** — 32-byte random token stored only as a SHA-256 hash plus a short prefix for lookup; per-contact, expiring, revocable, with `last_viewed_at` and view count
- **`client_link_views`** — timestamp, hashed IP, user agent

The client page renders from an **explicit allowlist projection** — address,
milestone labels and dates, current step, next step. Price, loan amount, party
contact details and internal notes are not in the query at all, so they cannot
leak through a bug.

### Notifications and risk
- **`notification_rules`** — team default with per-deal override: event, channel, audience, mode (`auto`/`approve_first`/`off`)
- **`notifications`** (outbound queue) — every outbound message passes through one state machine, so quiet hours, opt-out checks and approve-first are enforced in exactly one place
- **`risk_rules`** / **`deal_risk_flags`** — upserted on (deal, rule) so a stalled deal produces one persistent flag, not a daily pile; supports snooze and resolve-with-reason

### Built for later, not built now
- **`external_refs`** — (system, entity_type, entity_id) to external id. FUB, Qualia, SoftPro, Encompass plug in with no schema change
- **`webhook_deliveries`** — signature verified, payload, processed_at; idempotency for every inbound provider
- **`jobs`** — kind, payload, run_after, attempts, locked_by, state

### Deliberately absent

No `preferred_vendors`, no `referrals`, no lender/title lead-sharing, no
per-vendor billing relationship. Any of those turn this into a RESPA Section 8
problem. Recommendation: the SaaS lives in a separate legal entity from both the
title JV and the lending business, with its own bank account and its own
published price list.

---

## D. Phased build plan

Two deliberate reorderings from the original scope list:

- **Client page moves ahead of the deal inbox.** It depends only on milestones,
  it is the demo, and it makes the product useful to 30 agents in week 3 instead
  of week 6.
- **SMS moves last** among features, because its blocker is paperwork, not code —
  but Twilio/A2P registration starts in Phase 0 so approval clears during the build.

| Phase | Ships | Test | Accounts / env vars |
|---|---|---|---|
| **0 — Foundations** | Repo scaffold, Drizzle + Neon, RLS, Clerk orgs, roles, team/agent onboarding, UI shell, 3 seeded deals at different stages, jobs table + cron worker | Sign up, create a team, invite a second agent, see 3 fake deals, confirm agent B cannot see agent A's deal | Neon, Clerk. `DATABASE_URL`, `CLERK_*`, `CRON_SECRET`. **Twilio A2P registration starts here.** |
| **1 — Extraction + review screen** | PDF upload to Claude extraction with citations, review screen showing every field with confidence and the quoted contract line, agent confirms/edits, deal created. Nothing saves unreviewed | Upload a real NVAR RPA, see parsed fields, change one deliberately, confirm the diff lands in `extraction_reviews` and the audit log | Anthropic, Vercel Blob. `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN` |
| **2 — Milestones, deadlines, audit** | Milestone template engine, deadline computation from confirmed NVAR rules, manual status updates, timeline UI, audit log view | Change a milestone by hand and watch timeline + audit update; change acceptance date and watch every computed deadline shift | none new |
| **3 — Client deal page + email updates** | Tokenized no-login mobile page, progress bar, current/next step, "nothing needed from you" vs "action needed", revocable tokens, email updates on milestone change with auto/approve-first per deal | Open a seeded deal's client link on a phone, flip a milestone, receive the email; revoke the token and confirm the link dies | Resend. `RESEND_API_KEY`, `APP_BASE_URL` |
| **4 — Deal inbox + AI proposals** | Per-deal inbound address, Postmark webhook to stored thread, Claude proposes milestone updates with the quoted source line, one-click approve, audit-logged with source email | CC the deal address on a real escrow thread, watch the proposal appear, approve it, see the client update fire | Postmark, MX records on `deals.<domain>`. `POSTMARK_*`, `DEALS_EMAIL_DOMAIN` |
| **5 — SMS: consent, reply-by-text, STOP/HELP** | Opt-in capture + attestation, STOP/HELP/quiet hours enforced in the outbound queue, third-party status requests with stored reply mappings, "4"/free-text escalation to the agent, client SMS updates | Text the system as a fake escrow officer: reply "2" and watch the milestone move; reply STOP and confirm nothing else sends | Twilio (**A2P approval required for real numbers**). `TWILIO_*` |
| **6 — Risk radar** | Daily cron scoring every active deal, dashboard sorted by risk, flag snooze/resolve, weekly agent summary email | Backdate a seeded deal's appraisal deadline, run the cron, see it jump to the top in red | none new |
| **7 — Launch hardening** | README, deployment runbook, privacy policy + SMS terms pages (A2P requires them), token/PII review, rate limiting, error monitoring, data-deletion path | Deploy to Vercel from the README alone with no help | Sentry (optional) |

Seed data lands in Phase 0 and grows with each phase: one deal just under
contract, one mid-inspection with a live risk flag, one at clear-to-close.

After each phase: exact local test steps, plus the accounts to create for the
*next* phase, so setup happens in parallel with the build.

---

## Two flags

**1. Phase 3 is the go/no-go.** The client page plus email updates, on manually
entered milestones, is already a product 30 agents would use. If it does not
change their client conversations, the email and SMS automation will not save it.
Recommendation: ship Phase 3, put it in front of 5 agents for two weeks, and let
that decide whether Phases 4-6 get built as scoped.

**2. The deal inbox is most likely to disappoint.** Getting agents to reliably CC
an address is a behavior change, and escrow threads are noisy: forwarded chains,
quoted history, signature blocks, PDFs of wire instructions. Extraction accuracy
there is a genuinely open question, which is why every proposal goes to one-click
approval instead of straight to the milestone. Plan on Phase 4 taking longer than
it looks.
