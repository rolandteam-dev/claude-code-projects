# Offer Machine (Slack → offer terms sheet)

An agent types a plain-English request in Slack. The bot reads it, asks once for
anything missing, shows one confirmation card, and on **Confirm** posts a **terms
sheet** (in TransactionDesk field order) plus a **cover-email draft**. The agent
keys the terms into their own TransactionDesk and sends the offer as usual.

**It needs no TransactionDesk logins and never touches TransactionDesk.** Nothing
in this app sends a contract or an email.

```
Agent:  @Offers write an offer for Mark Smith and Megan Smith as agent Mike Rowland
        on 123 Main Street for $500,000
Bot:    I read "Mike Rowland" as Mike Roland.
        Got so far: Buyers Mark Smith and Megan Smith · Offer price $500,000 · ...
        To finish this offer I still need:
        • the list price
        • how they're paying (cash, conventional, FHA, VA)
Agent:  520k list, cash, 10k earnest
Bot:    [card] Offer price $500,000 · List price $520,000 · Financing Cash ·
        Earnest money $10,000 · Close of escrow Dec 17, 2026 (default) · ...
        [Confirm and get the sheet] [Cancel]
Agent:  make it $510k          → the old card is retired, a new one appears
Agent:  (clicks Confirm)       → terms sheet + cover email, in the thread
```

## Who decides what

The language model **only reads** the message into fields. Everything that
decides what the offer says is plain code (`src/lib/offers/terms.ts`):

- what's missing, and the single question that asks for it
- defaults, and the "(default)" label on every term the agent didn't state
- validation: offer far from list, cash + loan contingency, past close date,
  earnest money above the offer, seller credit over 10%, days out of range,
  **FHA below 3.5% down**, a down payment on a cash offer
- the sheet and the cover email, which state only what was confirmed

A model mistake can therefore only show up on the card the agent reads, never
silently in the offer. Specific guards: implausible prices (under $10,000) are
dropped so the bot asks again; agent names are matched against the Slack team
(`Rowland` → `Roland`) and flagged if not found; **Confirm is bound to the card's
version**, so an old card can't confirm a changed offer; the sheet is the stored
snapshot of what the agent saw, not a recompute.

## Setup

### 1. Slack app

Add these to the existing Slack app (the roster sync's `SLACK_BOT_TOKEN`), or
create a new one that keeps `users:read`. Reinstall after changing scopes or events.

```yaml
display_information:
  name: Offer Machine
features:
  bot_user:
    display_name: Offers
    always_online: false
  slash_commands:
    - command: /offer
      url: https://<production host>/api/slack/commands
      description: Open the offer form
      should_escape: false
oauth_config:
  scopes:
    bot:
      - app_mentions:read
      - channels:history
      - groups:history        # only if #offers is a private channel
      - chat:write
      - commands
      - users:read
settings:
  event_subscriptions:
    request_url: https://<production host>/api/slack/events
    bot_events:
      - app_mention
      - message.channels
      - message.groups        # only if #offers is a private channel
  interactivity:
    is_enabled: true
    request_url: https://<production host>/api/slack/interactions
  org_deploy_enabled: false
  socket_mode_enabled: false
```

Use the same production host you use for other webhooks (API routes are never
redirected by the middleware). Create `#offers`, invite the bot (`/invite
@Offers`), and add Kristi (transaction coordinator) to the channel as a viewer.
Each offer is its own thread, so she sees every request without anything routed
to her. Offers must happen **in the channel**: if the bot isn't a member it can't
read them.

### 2. Environment variables

| Variable | Purpose |
| --- | --- |
| `SLACK_SIGNING_SECRET` | Slack app → Basic Information. Without it every Slack endpoint returns 503. |
| `SLACK_BOT_TOKEN` | Existing token, with the scopes above. |
| `ANTHROPIC_API_KEY` | Lets the bot read requests. Without it the bot says so and the `/offer` form still works. |
| `OFFER_ALLOWED_SLACK_USERS` | CSV of Slack user ids (`U…`) who may use the bot. **Empty = nobody.** Everyone else is ignored (an @mention gets "not set up"). |
| `OFFER_CHANNEL_ID` | CSV of channel ids. When set, the bot answers only there, and a plain message in it (no @mention) starts an offer. Unset = @mentions only, in any channel the bot is in. |
| `OFFER_LLM_MODEL` | Optional model override. Default `claude-opus-5-5`. |
| `DATABASE_URL` | Existing Postgres. Tables are created on first use. |
| `REPLIERS_API_KEY` | Existing. If the property is found in the MLS by an **exact street match**, the list price and MLS # are filled in; otherwise the bot just asks. |

Find a Slack user id: profile → ⋮ → Copy member ID. Channel id: channel name → About.

### 3. Defaults (placeholders today)

`src/content/offerDefaults.ts` holds the terms the bot fills when an agent
doesn't state them (earnest money %, close-of-escrow days, contingencies and
their day counts). **They are placeholders, not the team's standard terms.** Every
card and sheet says so while `OFFER_DEFAULTS_ARE_PLACEHOLDERS` is `true`.

To switch to the real ones: edit the values from the transaction coordinator's
template, then set the flag to `false`. Also useful from her: the list of things
she most often has to chase agents for. That decides what the bot should treat as
"required" (the list in `resolveTerms`).

## What it doesn't do (yet)

- **No buyer lookup in Follow Up Boss.** Buyer names are taken as typed.
- **Free-text terms are not applied.** Down payment, seller credit, home warranty,
  included items and the contingency day counts are real fields. Anything else
  (rent-back, possession, etc.) is kept as a note on the sheet and checked by
  nobody. Add a real field when a term recurs.
- **The down payment is never defaulted.** For a financed offer the bot always asks
  if it wasn't stated. The only down-payment rules built in are FHA's 3.5% floor
  and "no down payment on cash"; other loan programs' minimums are not checked.
- **The `/offer` form lacks the newer fields** (down payment, warranty, included
  items). Use the chat flow for those.
- **Buyer offers only.** Counters and seller-side review are not built.
- **Names and prices go to the Claude API.** Messages (client names, addresses,
  prices) are sent to Anthropic to be read. Confirm that's acceptable with the
  broker. The database keeps the extracted terms, not the raw messages.
- **Fair Housing.** There is no automated check on free-text notes.
- **One message at a time.** Two replies sent within a second in the same thread
  can race, and the second may overwrite the first's change. The card always shows
  the final state, so check it before confirming.

## Tests

`npm run offers:test` runs 40 pure-logic checks (defaults, validation, name
matching, what the model may and may not return, signatures, the sheet and email).

## Stage 2 (off by default): a drafting machine

An earlier design queued each request for a separate logged-in machine that would
fill TransactionDesk itself. It is **not used** while agents build their own offers,
because it would need each agent's login stored on a server. The code is still
here, switched off, in case that ever changes: set `OFFER_QUEUE_ENABLED="true"`
and the `/offer` form queues a job instead of posting the sheet. The machine
polls `POST /api/offers/worker/claim` and reports to
`POST /api/offers/worker/<id>` with `Authorization: Bearer $OFFER_WORKER_TOKEN`
(`OFFER_WORKER_TOKEN`, `OFFER_REVIEWER_SLACK_USERS`; read-only queue view at
`/api/admin/offers?key=ADMIN_TOKEN`). A draft whose reported values disagree with
the typed terms cannot be approved. See `src/app/api/offers/worker/` for the contract.
