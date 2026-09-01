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

## 3. The subdomain (where homeowners land) — required
Dashboards and emails link to a Roland Team subdomain (kept separate from the
Roland Luxury marketing site).

- [ ] In Vercel → project → **Domains**, add `home.therolandteam.com`.
- [ ] Add the DNS record Vercel shows (a CNAME at your `therolandteam.com` DNS host).
- [ ] In Environment Variables, add:
  - `HOMEOWNER_BASE_URL` = `https://home.therolandteam.com`

## 4. Automation secret (protects the cron jobs) — required
- [ ] Add `CRON_SECRET` = any long random string (e.g. from a password generator).
      Vercel automatically sends this to the scheduled jobs; it also blocks anyone
      from triggering them manually.

## 5. Seller Radar access (internal dashboard) — required to view it
- [ ] Add `ADMIN_TOKEN` = a private key only your team knows.
- [ ] Open the dashboard at `home.therolandteam.com/admin/sellers?key=YOUR_ADMIN_TOKEN`
      (bookmark it with the key). Without the token it stays locked.

## Already set (nothing to do) ✅
- `REPLIERS_API_KEY`, `REPLIERS_BOARD_ID`, `IDX_PROVIDER` — powers the value estimates.
- `FUB_API_KEY` — powers the database import + lead routing.

---

## After it's live — verify the loop
1. **Seed a homeowner:** run the FUB import once —
   `home.therolandteam.com/api/cron/fub-sync?secret=YOUR_CRON_SECRET`
   → should return `{ imported: N }`.
2. **Check the Radar:** open `/admin/sellers?key=YOUR_ADMIN_TOKEN` → your contacts appear.
3. **Test a dashboard:** click any "Open" link → the homeowner value page renders on
   the subdomain.
4. **Test the digest (dry run first):**
   `…/api/cron/homeowner-digest?secret=YOUR_CRON_SECRET&dryRun=1` → shows how many are
   due. Drop `&dryRun=1` to actually refresh values + send one round of emails.

## What runs automatically
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
