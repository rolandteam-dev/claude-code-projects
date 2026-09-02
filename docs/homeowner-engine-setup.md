# Homeowner Engine — Go-Live Setup (Fello replacement)

This turns on the homeowner value dashboards, automated value emails, engagement
tracking, and the Seller Radar. Everything is already built and merged; it stays
dormant until the items below are set. Budget ~15–20 minutes.

The code reads all config from environment variables and degrades gracefully, so
you can turn pieces on one at a time.

---

## 1. Database (persistence) — required
The engine stores homeowners + value history here.

- [ ] Vercel → your project → **Storage** → **Create Database** → **Postgres** → create.
- [ ] When prompted, **connect it to the `claude-code-projects` project** and the
      **Production** environment. Vercel auto-adds `POSTGRES_URL` (the code reads it
      automatically — no manual variable needed).
- [ ] That's it — the table is created automatically on first use.

*(Any Postgres works — Neon, Supabase, etc. If you use one of those instead, add its
pooled connection string as `DATABASE_URL` in Vercel.)*

## 2. Email sending (automated value updates) — required for emails
- [ ] Create a **Resend** account (resend.com).
- [ ] **Verify your sending domain** `therolandteam.com` (Resend gives you DNS records
      to add — SPF/DKIM). This is what lets emails land in inboxes.
- [ ] Create an API key.
- [ ] In Vercel → Environment Variables (Production), add:
  - `RESEND_API_KEY` = your Resend key
  - `HOMEOWNER_FROM_EMAIL` = `The Roland Team <home@therolandteam.com>`

> **Setting these keys does not start any sending.** Homeowner email is off until
> `HOMEOWNER_EMAIL_ENABLED` is set to `true` — see *Turning sending on* at the end.
> Provision the keys now; flip the switch only once you have clicked a real email
> end to end yourself.

## 3. The subdomain (where homeowners land) — OPTIONAL
**No DNS work is required.** Dashboards, portal hubs and every link in an email
default to the main site origin (`site.url`), where these pages already live at
`/dashboard/<token>` and `/portal`. That works today.

Do this section only if you want the Roland Team brand in the URL as well as on
the page — homeowners landing on `home.therolandteam.com` rather than the
Roland Luxury domain.

- [ ] In Vercel → project → **Domains**, add `home.therolandteam.com`.
- [ ] Add the CNAME Vercel shows, **wherever `therolandteam.com`'s DNS is
      managed** — that is your registrar, or whoever runs the Roland Team site
      today. It is a new record on a new subdomain: your existing site is
      untouched.
- [ ] Confirm `https://home.therolandteam.com/dashboard/demo` loads.
- [ ] Only then, in Environment Variables, add:
  - `HOMEOWNER_BASE_URL` = `https://home.therolandteam.com`

Setting `HOMEOWNER_BASE_URL` before the subdomain resolves is worse than leaving
it unset: it points every email button and unsubscribe link at a dead host.

## 4. Automation secret (protects the cron jobs) — required
- [ ] Add `CRON_SECRET` = any long random string (e.g. from a password generator).
      Vercel automatically sends this to the scheduled jobs; it also blocks anyone
      from triggering them manually.

## 5. Seller Radar access (internal dashboard) — required to view it
- [ ] Add `ADMIN_TOKEN` = a private key only your team knows.
- [ ] Open the dashboard at `/admin/sellers?key=YOUR_ADMIN_TOKEN` on your site
      (bookmark it with the key). Without the token it stays locked.

## Already set (nothing to do) ✅
- `REPLIERS_API_KEY`, `REPLIERS_BOARD_ID`, `IDX_PROVIDER` — powers the value estimates.
- `FUB_API_KEY` — powers the database import + lead routing.

---

## After it's live — verify the loop
1. **Seed a homeowner:** run the FUB import once —
   `/api/cron/fub-sync?secret=YOUR_CRON_SECRET` on your site
   → should return `{ imported: N }`.
2. **Check the Radar:** open `/admin/sellers?key=YOUR_ADMIN_TOKEN` → your contacts appear.
3. **Test a dashboard:** click any "Open" link → the homeowner value page renders.
4. **Test the digest (dry run first):**
   `…/api/cron/homeowner-digest?secret=YOUR_CRON_SECRET&dryRun=1` → shows how many are
   due. Drop `&dryRun=1` to actually refresh values + send one round of emails.

## Turning sending on (do this LAST)

Homeowner email is **off by default**. All three senders — the welcome email from
the home-value funnel, the cash-offer confirmation, and the weekly value digest —
refuse to send until this is set. Nothing goes to a consumer before then.

Do not flip this until:

- [ ] A dashboard link loads in a browser — whichever origin you are using. If you
      set `HOMEOWNER_BASE_URL` to a subdomain, check that subdomain specifically:
      if it does not resolve, every button *and the unsubscribe link* in a
      delivered email is dead, and an unsubscribe that 404s is the CAN-SPAM
      problem, not just a broken link.
- [ ] You have sent yourself one real email and clicked both the dashboard button
      and the unsubscribe link.

Then, and only then:

- [ ] Vercel → Environment Variables → `HOMEOWNER_EMAIL_ENABLED` = `true`.
- [ ] Restore the weekly digest cron in `vercel.json` (removed while sending was
      held), then redeploy:
      `{ "path": "/api/cron/homeowner-digest", "schedule": "0 16 * * 1" }`

To pause sending again at any time, set `HOMEOWNER_EMAIL_ENABLED` to anything other
than `true` (or delete it) and redeploy. The funnels keep working and keep capturing
leads — they just stop emailing.

## What runs automatically
*(The value digest is currently held — its cron is removed and sending is off. The
FUB sync still runs; it only imports contacts and never emails.)*

- **Mondays ~8 AM PT:** FUB sync (new/updated contacts) + the value-update digest to
  anyone due (every ~2 weeks per person). Schedules live in `vercel.json`.

## The economics
Replaces Fello (~$1,200/mo). Ongoing cost: Vercel Postgres (~$0–20/mo) + Resend
(~$20/mo). Repliers + FUB you already pay for.

## Compliance notes
- Emails include a one-click unsubscribe + your business identity (CAN-SPAM). Only
  email people you have a relationship with (your database).
- SMS is intentionally **not** enabled yet — it requires 10DLC registration and
  explicit consent. It's a Phase 3 add-on.
