# Build-out prompt for Claude Cowork — Roland Team "Homeowner Engine" (Fello replacement)

> Paste everything below the line into Claude Cowork. It is self-contained.

---

You are continuing the build of a **Fello.ai replacement** for a Las Vegas real
estate business (The Roland Team / Roland Luxury). Fello is a ~$1,200/mo
database-engagement platform for seller leads; we are rebuilding its core inside
the team's own Next.js website so it runs on tools they already pay for
(Repliers AVM + Follow Up Boss CRM) for ~$20–40/mo.

## The codebase
- **Repo:** `rolandteam-dev/claude-code-projects`. Work on branch
  `claude/roland-luxury-setup-ixjhpr` (or a branch off it); open a PR into `main`.
- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4.
  Mostly static/SSG; API routes and per-recipient pages are dynamic.
- **IMPORTANT:** Next 16 has breaking changes vs. older versions. Read the guides in
  `node_modules/next/dist/docs/` before writing framework code. Follow the existing
  file patterns rather than assuming older Next conventions.
- **Two brands via route groups:** `src/app/(site)` = Roland Luxury marketing site;
  `src/app/(homeowner)` = The Roland Team homeowner engine (served from the
  `home.therolandteam.com` subdomain). Keep them separate.
- **Design tokens** (Tailwind CSS vars in `src/app/globals.css`): `--color-gold`,
  `--color-graphite`, `--color-sand`, `--color-ink`, `--color-ink-soft`,
  `--color-line`, `--color-muted`; classes `.btn`, `.btn-ghost`, `.eyebrow`. Match the
  existing look; serif display + sans UI.

## What already exists (Phase 1 — done)
- **Data layer:** `src/lib/homeowners/store.ts` — `HomeownerStore` interface + types
  (`Homeowner`, `EstimatePoint`), in-memory driver (seeded, dev/build only),
  `homeownerStore()` selector, `newToken()`, and derived helpers `latestEstimate`,
  `appreciation`, `engagementScore`.
- **Postgres driver:** `src/lib/homeowners/postgres.ts` — activates when
  `DATABASE_URL`/`POSTGRES_URL` is set; single table, JSONB estimates/views, lazy
  idempotent schema.
- **AVM:** `src/lib/homeowners/avm.ts` — `fetchEstimate(homeowner)` via Repliers
  (`REPLIERS_API_KEY`), returns an `EstimatePoint`, no-op without the key.
- **Email:** `src/lib/homeowners/email.ts` — branded value email via Resend
  (`RESEND_API_KEY` + `HOMEOWNER_FROM_EMAIL`), CAN-SPAM unsubscribe.
- **Brand:** `src/lib/homeowners/brand.ts` — `homeownerBrand`, `dashboardUrl(token)`,
  reads `HOMEOWNER_BASE_URL`.
- **Homeowner dashboard:** `src/app/(homeowner)/dashboard/[token]/page.tsx` +
  `src/components/HomeownerDashboard.tsx` — value, range, trend sparkline,
  appreciation, "Request Full Report" (→ FUB lead), view beacon.
- **Agent Seller Radar:** `src/app/admin/sellers/page.tsx` — engagement-ranked
  database table, gated by `ADMIN_TOKEN` via `?key=`.
- **API routes:** `/api/homeowners/ingest` (funnel), `/api/cron/homeowner-digest`
  (refresh + email due, `CRON_SECRET`), `/api/cron/fub-sync` (import FUB contacts),
  `/api/dashboard/unsubscribe`, `/api/dashboard/view`.
- **Schedules:** `vercel.json` weekly crons.

## Config model (every integration is env-gated + degrades gracefully)
`DATABASE_URL`/`POSTGRES_URL`, `RESEND_API_KEY`, `HOMEOWNER_FROM_EMAIL`,
`HOMEOWNER_BASE_URL`, `CRON_SECRET`, `ADMIN_TOKEN`, plus existing `REPLIERS_API_KEY`,
`REPLIERS_BOARD_ID`, `FUB_API_KEY`. Nothing may hard-crash when a key is absent.

## Your backlog (build in this order; each as its own commit, PR when a phase is done)
1. **Home-value funnel wiring** — when a homeowner uses the value tool, call
   `/api/homeowners/ingest`, then email them their dashboard link (welcome email in
   `email.ts`). Confirm double-opt-in language.
2. **Richer homeowner dashboard** — add local market context (active listings count,
   median, days-on-market for their ZIP via Repliers) and 3–5 recent comparable sales.
3. **Cash Offer** — a `(homeowner)` landing page + `/api/homeowners/cash-offer` that
   captures interest, tags the FUB contact, and routes to the team (and, later, an
   iBuyer partner). Add an automated follow-up email.
4. **Seller Radar upgrades** — filters (area, tier, subscribed), CSV export, and a
   one-click "push hot list to FUB as a Smart List / tags."
5. **SMS (Phase 3, gated)** — Twilio value-update + cash-offer texts. Requires A2P
   10DLC registration and explicit consent tracking on each `Homeowner`. Do NOT send
   without a stored consent flag.
6. **Direct mail (Phase 3, gated)** — postcards via a print API (e.g., Lob), triggered
   for high-engagement contacts.
7. **Tests** — unit tests for `engagementScore`, `appreciation`, matching, and the
   ingest/cron handlers with the in-memory store.

## Hard rules
- **Fair Housing:** describe places by objective attributes only — never demographics
  or coded language. (Stating a community's factual 55+ age qualification is fine.)
- **Graceful degradation:** guard every external call behind its env var; return a
  clean no-op/`{ok:true, queued:false}`-style response when unconfigured.
- **No secrets in the repo.** Read from `process.env`. Never commit keys.
- **Quality gate:** `npm run build` and `npm run lint` must both pass before every
  commit. Keep pages static where possible.
- **Approximate pricing / not-advice:** all value figures are estimates; always route
  to "contact for a precise CMA," and disclaim (not an appraisal / not tax advice).
- **Verification note:** external hosts (Repliers, FUB, Resend, Postgres) may be
  unreachable from the build sandbox — verify those on a Vercel preview deploy; verify
  everything else locally against the in-memory store.
- **Commit style:** clear messages; end with the Co-Authored-By / attribution footer if
  your environment specifies one.

Start with backlog item #1. Ask before adding any new paid dependency or a data vendor.
