# Seller Engine (phase 1)

Stacks public-records distress lists by parcel, scores each owner, filters out
Do Not Call numbers and existing Follow Up Boss contacts, and pushes a capped
number of the best owners into FUB each weekday for agents to **call**.

> **This repo is public.** Owner lists, exports, phone numbers and keys live only
> in Postgres, FUB and Vercel env vars. Never commit a CSV export, a "sample"
> with real owners, or a key. Test fixtures must be made up.

Nothing here is legal advice. Have a Nevada attorney sign off on the calling
program (TCPA, federal + NV Do Not Call, NRS 228.590/600, NRS 645F) before
`DISTRESS_PUSH_ENABLED` is ever set to `true`.

## How data gets in

1. **CSV upload (main path).** Export a list from PropStream (or any source with
   an APN, address, owner, phones and a DNC column) and upload it, one list type
   per file:

   ```
   curl -X POST -H "Content-Type: text/csv" --data-binary @export.csv \
     "https://home.therolandteam.com/api/admin/distress/import?key=$ADMIN_TOKEN&list=nod&source=propstream"
   ```

   `list` is one of `nod`, `hoa_default`, `trustee_sale`, `probate`,
   `tax_delinquent`, `lis_pendens`, `code_violation`, `vacant`, `expired`, `fsbo`. Re-uploading the same list
   refreshes it instead of duplicating it. An owner on several lists stacks.
   Keep files under ~4 MB (Vercel's request limit) and 20,000 rows; split bigger
   exports. The response lists which columns were recognised and warns when
   there's no APN, phone or DNC column.

   **DNC column:** a number is only callable when the file marks it clear. By
   default a blank DNC cell counts as *unscrubbed* and is never pushed. Add
   `&blankDnc=clear` only after you've confirmed that your export leaves the cell
   blank for clean numbers (and fills it for listed ones).

2. **County Recorder default notices (free, daily, by hand).** Each weekday
   morning, on the Recorder's public record search (AcclaimWeb → Search →
   Document Type), pick these document types and set From/To to the last
   recording day:

   - DEFAULT (DEF)
   - DEFAULT & ELECTION TO SELL (DETS)
   - BREACH & ELECTION TO SELL (BETS)
   - NOTICE OF TRUSTEE SALE (NTS)
   - LIS PENDENS (LISP)
   - TRUSTEE DEED (TSD)

   Click **Export to CSV**, then upload the file:

   ```
   curl -X POST -H "Content-Type: text/csv" --data-binary @recorder.csv \
     "https://home.therolandteam.com/api/admin/distress/recorder?key=$ADMIN_TOKEN&dryRun=1"
   ```

   Drop `&dryRun=1` to save. A default becomes `nod` (lender) or `hoa_default`
   (filed by an association or its collection agent); a trustee-sale notice
   becomes `trustee_sale`; a lis pendens becomes `lis_pendens`. A row whose
   Modifier says RESCISSION (or a cancellation/release) removes the matching
   notice, and a trustee's deed or deed in lieu removes every foreclosure signal,
   because the owner no longer owns the home. The homeowner is whichever party
   isn't a lender, trustee, servicer or HOA. These rows carry an APN and owner
   name but **no address or phone**: they become callable when the same APN
   comes in on a phone-bearing upload (PropStream). Re-uploading a day is safe.

   Why by hand: the Recorder publishes no bulk feed and no terms for automated
   access. Get the attorney's view before anyone scripts this search.

3. **County Treasurer delinquent-tax list (free, once a year).** The Treasurer
   publishes the list each May (parcel number, owner of record, amount due) as
   PDF and Excel. Save the Excel file as CSV and upload it with the list's
   "as of" date, so it ages out on schedule:

   ```
   curl -X POST -H "Content-Type: text/csv" --data-binary @delinquent.csv \
     "https://home.therolandteam.com/api/admin/distress/import?key=$ADMIN_TOKEN&list=tax_delinquent&source=treasurer&asOf=2026-05-06"
   ```

   The amount due goes into the signal's detail. Owners who have since paid stay
   on the list until it ages out (540 days), so check the Treasurer's site before
   a caller leans on it.

4. **City of Las Vegas code violations** (`/api/cron/distress-code-sync`, weekly,
   off unless `DISTRESS_ENGINE_ENABLED=true`). Free ArcGIS feed. **As of Nov 2026
   its newest case is Feb 27 2024**, so it adds almost nothing today. These
   parcels carry no phones; they only matter when the same APN also arrives on a
   phone-bearing upload. Admin preview: `?key=…&dryRun=1`.

## Scoring (`src/lib/distress/score.ts`)

Points per live signal (older signals age out): trustee sale 60, NOD 40,
probate 30, HOA default 25, tax delinquent 20, lis pendens 20, code violation
15, expired 15, vacant 10, FSBO 10. Bonuses: +15 per extra list stacked, +20
default (lender or HOA) + trustee sale, +10 several code
cases, +10 absentee owner, +10 owned 10+ years. Banks, GSEs, HOAs and
government owners score 0. Trusts and LLCs are kept.

## Push to Follow Up Boss (`/api/cron/distress-push`)

Weekdays 15:00 UTC (7 am PST / 8 am PDT). **Off by default.**

- Preview anytime (writes nothing): `/api/cron/distress-push?key=ADMIN_TOKEN`
- Manual send (only when enabled): `…?key=ADMIN_TOKEN&send=1`

What it does for each owner, best score first, until the daily cap:

- skips anyone whose phone matches an existing FUB contact (marks them, never
  re-assigns); if the FUB lookup fails, the owner is skipped, not pushed blind
- sends only DNC-clear phones, minus the internal do-not-call list
- creates the person via the FUB Events API, source **Seller Engine**, type
  Seller Inquiry, tags `Seller Engine` + `SE: <list>`, a note with the score and
  reasons, **no email address**
- assigns round-robin across `DISTRESS_AGENT_IDS` (fewest pushes today first),
  or leaves assignment to FUB's lead flow when that's empty

## Internal do-not-call

```
curl -X POST -H "Content-Type: application/json" \
  -d '{"key":"…","phones":["7025550100"],"reason":"asked not to be called"}' \
  https://home.therolandteam.com/api/admin/distress/dnc
```

Numbers on it are never pushed again, from any list.

## Overview

`/api/admin/distress?key=ADMIN_TOKEN` — counts, stacking histogram, phone DNC
status, push settings and the current top 25.

## Before switching it on (Mike / admin)

1. Attorney sign-off on the calling program and scripts.
2. National DNC registry subscription for the 702/725 area codes; scrub every
   list (PropStream's DNC flag) and keep the internal list current.
3. In FUB, set the lead flow for source **Seller Engine** with **no action plan
   that texts or emails** and no auto-responder. These are cold owners: call only.
4. Put the callers' FUB user ids in `DISTRESS_AGENT_IDS`.
5. Upload lists, check `/api/admin/distress` and the push preview, then set
   `DISTRESS_PUSH_ENABLED=true`.

## Env vars

| Var | Default | Meaning |
| --- | --- | --- |
| `DISTRESS_PUSH_ENABLED` | off | Must be `"true"` for anything to be pushed |
| `DISTRESS_AGENT_IDS` | empty | CSV of FUB user ids for round robin |
| `DISTRESS_PER_AGENT_DAILY` | 7 | Pushes per agent per day (max 50) |
| `DISTRESS_DAILY_CAP` | 84 | Total per day when no agent ids are set |
| `DISTRESS_MIN_SCORE` | 30 | Minimum score to push |
| `DISTRESS_ALLOW_UNSCRUBBED` | off | `"true"` lets numbers with unknown DNC status through. Leave off. |
| `DISTRESS_ENGINE_ENABLED` | off | `"true"` runs the weekly Las Vegas code sync |
| `DISTRESS_CODE_MAX_AGE_DAYS` | 730 | How far back the code sync looks |

Self-test (pure logic, no DB): `npm run distress:test`.
