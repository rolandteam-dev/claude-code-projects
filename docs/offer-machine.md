# Offer Machine (Slack → TransactionDesk draft)

A Slack front door for drafting offers. An agent types `/offer`, fills a form, and a
**draft** appears in TransactionDesk for them to review. The agent approves in
Slack; a person then sends it through Authentisign.

**Nothing in this app ever sends a contract.** Approving records a decision and
nothing else.

## How it fits together

```
/offer  ──►  modal (typed terms)  ──►  offer_jobs (Postgres, status: queued)
                                              │
              drafting machine polls  ◄───────┘   POST /api/offers/worker/claim
              (logged in to Matrix / TransactionDesk,
               runs the write-offer-transactiondesk skill)
                                              │
              saves a TD draft, reports back ─┘   POST /api/offers/worker/<id>
                                              │
Slack thread: typed terms + draft summary + flags + [Approve] [Request changes]
```

Why a separate machine: TransactionDesk has no API this app can call, so the
draft is made by driving the browser. That needs a logged-in session, which a
serverless function can't hold. The machine **pulls** work, so it needs no
inbound access.

Code: `src/lib/offers/` (types + validation, db, slack, config),
`src/app/api/slack/{commands,interactions}`, `src/app/api/offers/worker/`,
`src/app/api/admin/offers`. Self-test: `npm run offers:test`.

## Phase 1 scope

Buyer offers only (cash and financed). `/offer counter` and `/offer review` are
wired but switched off (`ENABLED_JOB_TYPES` in `src/lib/offers/types.ts`) until
the buyer flow has proven itself.

## Setup

### 1. Slack app

Add to the existing Slack app (the roster sync's `SLACK_BOT_TOKEN`) or create a
new one — but if you create a new one, its token must keep `users:read`, because
the monthly roster sync uses the same variable. Reinstall after changing scopes.

```yaml
display_information:
  name: Offer Machine
features:
  bot_user:
    display_name: Offer Machine
    always_online: false
  slash_commands:
    - command: /offer
      url: https://<production host>/api/slack/commands
      description: Draft a buyer offer
      usage_hint: "[counter | review]"
      should_escape: false
oauth_config:
  scopes:
    bot:
      - commands
      - chat:write
      - users:read
settings:
  interactivity:
    is_enabled: true
    request_url: https://<production host>/api/slack/interactions
  org_deploy_enabled: false
  socket_mode_enabled: false
```

Use the same production host you already use for webhooks. API routes are never
redirected by the middleware. Invite the bot to the channel agents will use
(`/invite @Offer Machine`). If it isn't a member, the thread is posted as a DM to
the requester instead, so a draft is never invisible.

### 2. Environment variables

| Variable | Purpose |
| --- | --- |
| `SLACK_SIGNING_SECRET` | Slack app → Basic Information → Signing Secret. Without it both Slack endpoints return 503. |
| `SLACK_BOT_TOKEN` | Existing. Needs `commands`, `chat:write`, `users:read`. |
| `OFFER_ALLOWED_SLACK_USERS` | CSV of Slack user ids (`U…`) who may run `/offer`. **Empty = nobody.** |
| `OFFER_REVIEWER_SLACK_USERS` | CSV of ids who may Approve / Request changes on *any* draft (e.g. the broker). The requesting agent can always review their own. Reviewers must also be in the allowlist. |
| `OFFER_WORKER_TOKEN` | Long random string. The drafting machine sends it as a Bearer token. Without it the worker endpoints refuse everyone. |
| `DATABASE_URL` | Existing Postgres. The `offer_jobs` table is created on first use. |
| `ADMIN_TOKEN` | Existing. Gates `/api/admin/offers?key=…`, a read-only queue view (status, address, timing only — no names or prices). |

Find a Slack user id: profile → ⋮ → Copy member ID.

### 3. The drafting machine (not in this repo)

A Mac or VM that stays signed in to Matrix and TransactionDesk. It loops:

1. `POST /api/offers/worker/claim` with `Authorization: Bearer $OFFER_WORKER_TOKEN`.
   Returns `{ "job": null }` or:
   ```json
   { "ok": true, "job": {
       "id": "…uuid…", "jobType": "buyer_offer", "requestedBy": "U0123ABC", "attempt": 1,
       "inputs": { "address": "…", "clientName": "…", "fubPersonId": "4821",
                   "listPrice": 850000, "offerPrice": 835000, "financing": "conventional",
                   "earnestMoney": 10000, "closeDate": "2026-12-30",
                   "contingencies": ["inspection", "appraisal", "loan"], "notes": "…" } } }
   ```
   `inputs` are the **typed** terms and are the source of truth. `notes` is context
   for the drafter only — it must never change a price, date or contingency.
2. Draft the offer in TransactionDesk **under the agent of record** (`requestedBy`
   maps to a Slack user; see "Open problems"). Stop at a saved draft. Do not send
   to Authentisign.
3. Re-read the saved draft and compare it field by field to `inputs`.
4. Report: `POST /api/offers/worker/<id>`
   ```json
   { "status": "needs_review",
     "result": { "summary": "Drafted RPA + addenda. EMD due 3 days after acceptance.",
                 "tdUrl": "https://…",
                 "flags": ["Seller disclosure date not in the listing; left blank"],
                 "mismatches": [] } }
   ```
   or `{ "status": "failed", "error": "TransactionDesk login needs MFA" }`.

**`mismatches` is the safety net.** List every field where the draft disagrees
with `inputs` ("Offer price in TD is 853000, typed 835000"). A non-empty list
removes the Approve button, so the agent can only request changes. Report them
honestly; do not "fix and hide".

`flags` are things the drafter guessed or couldn't fill. They're shown to the
reviewer but don't block approval.

A claimed job that isn't reported within 20 minutes goes back in the queue, and
after 3 attempts it is failed and the Slack message says so.

## What the Slack message shows

The **typed terms** (offer, list %, financing, earnest money, close date,
contingencies) always render from what the agent entered, never from what the
machine claims, so the reviewer compares the two. All user- and machine-supplied
text is escaped, so a note can't trigger `@channel` or a fake link.

## Open problems (decide before going live)

- **Whose TransactionDesk login?** Drafts should be created under the licensed
  agent of record, not one shared account. That means the machine needs a
  per-agent session and a Slack-id → agent mapping. This is not built.
- **MFA.** An unattended machine will hit it. Test this first.
- **Fair Housing.** Notes go to the drafter as free text. There is no automated
  check on them yet.
- **Counters and seller-side** are not enabled. Counters depend on reading the
  prior offer correctly; seller-side is mostly analysis (net-to-seller across
  offers) with little form filling.
