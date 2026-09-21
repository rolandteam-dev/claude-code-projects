# DealDesk

Contract-to-close communication for real estate agents. Collects status from the
people who will never log into a portal — lenders, escrow, the other agent — and
turns it into proactive plain-English updates for the client and risk alerts for
the agent.

**Current state: Phase 0 (foundations).** Multi-tenant database, auth, roles,
job runner, and a read-only pipeline dashboard over seeded data. Contract
extraction, the deal inbox, SMS, and the client page land in later phases — see
`../../docs/dealdesk-spec.md`.

---

## Quick start

```bash
cd apps/dealdesk
npm install
cp .env.example .env.local     # then edit — see "Environment variables"
npm run db:migrate
npm run db:seed
npm run dev                    # http://localhost:3000
```

With no Clerk account configured, the app signs you in as the seeded user in
`DEV_AUTH_EMAIL`. That bypass only works outside production (see **Auth**).

---

## Requirements

- Node.js 20.9+ (Next 16 minimum)
- PostgreSQL 16+ — Neon in any deployed environment, local Postgres for dev

---

## Environment variables

Copy `.env.example` to `.env.local`. Only the first two are needed to boot.

| Variable | Required | What it does |
|---|---|---|
| `DATABASE_URL` | yes | **Owner** connection. Runs migrations and the few legitimately cross-tenant paths (cron runner, webhook tenant resolution). Bypasses RLS. |
| `DATABASE_URL_APP` | prod | **Restricted** runtime connection (`dealdesk_app`). RLS is forced on this role. Required in production; locally it falls back to `DATABASE_URL` with a warning. |
| `APP_BASE_URL` | no | Absolute base for links. Defaults to `http://localhost:3000`. |
| `CRON_SECRET` | prod | Bearer token for `/api/cron/*`. Without it the cron route refuses to run in production. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | prod | Clerk. Both Clerk vars must be set together. |
| `CLERK_SECRET_KEY` | prod | Clerk. |
| `DEV_AUTH_EMAIL` | no | Local-only auth bypass. **Refused in production.** |

Later phases add `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`,
`POSTMARK_*`, `DEALS_EMAIL_DOMAIN` and `TWILIO_*`. They are listed, commented
out, in `.env.example` so the shape is known in advance.

---

## Enforcing tenant isolation

The app holds other brokerages' client data, so isolation is enforced by
Postgres, not by remembering to write `where team_id = ...`. Every tenant table
has row-level security **enabled and forced**, and the app connects as a
`NOBYPASSRLS` role whose team context is set per transaction.

Create the runtime role once per database:

```sql
CREATE ROLE dealdesk_app LOGIN PASSWORD '<choose-a-strong-password>' NOBYPASSRLS;
```

Then run `npm run db:migrate` — the migration grants it the right privileges
(and re-grants idempotently on later runs). Point `DATABASE_URL_APP` at it.

All tenant-scoped reads and writes go through `withTeam(teamId, fn)` in
`src/db/index.ts`, which opens a transaction and pins
`app.current_team_id` for its duration.

**Verify it yourself** (expect `0`, then `3`, then `0`):

```bash
psql "$DATABASE_URL_APP" -tAc "select count(*) from deals;"
psql "$DATABASE_URL_APP" -tAc "begin; select set_config('app.current_team_id','<roland-team-id>',true); select count(*) from deals; commit;"
psql "$DATABASE_URL_APP" -tAc "begin; select set_config('app.current_team_id','<roland-team-id>',true); select count(*) from deals where team_id='<other-team-id>'; commit;"
```

The last one is the important case: even an explicit cross-tenant query returns
nothing.

---

## Auth

`src/lib/auth.ts` is the only place that answers "who is calling, for which
team". Two providers:

- **Clerk** — used whenever both Clerk keys are set. `src/proxy.ts` mounts
  `clerkMiddleware` (Next 16 renamed `middleware` to `proxy`).
- **Dev bypass** — used when Clerk is not configured. Signs you in as the seeded
  user named by `DEV_AUTH_EMAIL`, so the app and its seed data are usable before
  a Clerk account exists.

The bypass **throws** in a production build rather than being silently ignored,
so a misconfigured deploy fails loudly instead of authenticating a stranger.

### Roles

| Role | Sees |
|---|---|
| `owner`, `admin` | Every deal on the team |
| `agent` | Deals they own or are assigned to |
| `tc` | Deals they are assigned to |

RLS handles cross-tenant isolation; this within-team rule lives in
`visibilityFilter()` in `src/lib/repo/deals.ts`.

---

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Wipe and reseed sample data |
| `npm run db:reset` | Drop the schema (local only) |
| `npm run db:studio` | Drizzle Studio |
| `npm run jobs:test` | Queue a passing and a failing job to exercise the runner |

---

## Seed data

`npm run db:seed` creates two tenants:

**The Roland Team** — three deals at different stages:

1. `1042 Quiet Harbor Ct`, Henderson — just under contract, EMD in, on track
2. `8817 Desert Bloom Ave`, Las Vegas — mid-inspection, **appraisal not ordered
   with the deadline days away**; carries two critical risk flags
3. `2295 Summit Ridge Dr`, Henderson — clear to close, days from funding

Plus `Sunbelt Realty Group`, a second tenant with one deal. It exists so tenant
isolation is observable: signed in as The Roland Team you should never see
`551 Palm Grove Ln` anywhere.

The seed prints client-page tokens for each deal. Those are the Phase 3 links;
tokens are shown once and only their SHA-256 hash is stored.

---

## Background jobs

A database-backed queue (`jobs` table) drained by `GET /api/cron/jobs`, wired to
a once-a-minute Vercel Cron in `vercel.json`. Claims use
`for update skip locked`, so overlapping cron runs cannot double-send.

```bash
npm run jobs:test
curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/jobs
```

You should see one success and one failure (`extract_contract` has no handler
until Phase 1), with the failure re-queued on an exponential backoff.

---

## Deploying to Vercel

1. **Database** — create a Neon project. Put the owner connection string in
   `DATABASE_URL`. Create the `dealdesk_app` role (above) and put its string in
   `DATABASE_URL_APP`.
2. **Import the project** — set the Vercel *Root Directory* to
   `apps/dealdesk`. Framework preset: Next.js. Build and install commands are
   the defaults.
3. **Environment variables** — set `DATABASE_URL`, `DATABASE_URL_APP`,
   `APP_BASE_URL` (your deployed URL), `CRON_SECRET` (any long random string),
   and both Clerk keys. Do **not** set `DEV_AUTH_EMAIL`; the build refuses it.
4. **Migrate** — run `npm run db:migrate` against the production database from
   your machine, or add it to the build command once you are comfortable with
   migrations running on deploy.
5. **Cron** — `vercel.json` already registers `/api/cron/jobs` every minute.
   Vercel sends `CRON_SECRET` as a bearer token automatically.

---

## Architecture notes

- **Money is integer cents.** Never floats.
- **Contract deadlines are `date`, not timestamps.** A deadline is a calendar
  day in the property's timezone; storing instants causes off-by-one-day bugs.
  All date math lives in `src/lib/dates.ts` and runs in UTC on `yyyy-mm-dd`
  strings.
- **Milestone keys are storage keys.** They key client progress and every audit
  row. Never rename, renumber or repurpose one — add a new key.
- **`audit_events` is append-only**, enforced by a trigger that rejects UPDATE
  and DELETE.
- **Extracted contract dates require human review.** A `deal_dates` row with
  `source = 'contract'` and a document attached is rejected by a trigger unless
  a matching `extraction_reviews` row exists. "Never auto-trust extracted dates"
  is a database constraint, not a convention.
- **No referral, lead-sharing or preferred-vendor tables, deliberately.** Adding
  them would turn this into a RESPA Section 8 problem.

---

## Known gaps in Phase 0

- **The NVAR deadline ruleset in `src/lib/deadlines.ts` is UNCONFIRMED.** The
  periods are plausible placeholders, not verified against the NVAR Residential
  Purchase Agreement, and holidays are not handled at all. Every date derived
  from them is stored and displayed as `computed`. Confirm the real rules before
  anyone relies on these.
- The Clerk path is implemented but **untested** — it was built without Clerk
  credentials. The dev-bypass path is verified end to end.
- Team invites and org creation are not wired to Clerk organizations yet.
- The dashboard and deal pages are read-only; editing arrives in Phase 2.
