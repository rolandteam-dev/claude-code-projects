This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Going live with IDX listings (Repliers)

Listings are served through a provider abstraction (`src/lib/idx/`). The app
calls `getListings()` / `getListing()` and never knows which backend answers;
the backend is chosen by the `IDX_PROVIDER` env var and defaults to built-in
**sample data** so the UI is fully functional before a live feed is connected.

To switch the live site over to the real Repliers MLS feed, set two environment
variables in **Vercel → Project → Settings → Environment Variables** (they are
secrets — never commit them):

| Variable | Value |
| --- | --- |
| `IDX_PROVIDER` | `repliers` |
| `REPLIERS_API_KEY` | your Repliers API key (start with the sandbox key, then the production key) |

Then redeploy. That's the whole switch — no code change. Listing pages
(`/listings`, `/listings/[id]`) render on demand and cache each Repliers
response for 15 minutes (`revalidate: 900`), so new/updated MLS listings appear
within ~15 minutes without a rebuild.

Before go-live, confirm two things against a **real Repliers sandbox response**:

1. **Field names.** `src/lib/idx/repliers.ts` maps Repliers' documented shape,
   but a few keys/enumerations vary by MLS. Fetch one live listing and verify
   price, beds/baths, sqft, photos, and status map correctly.
2. **IDX compliance text.** Replace the placeholder disclaimer in
   `src/components/IdxDisclaimer.tsx` with GLVAR's exact required IDX
   attribution/disclaimer wording.

Live listings are automatically cross-linked to the matching community page
when their subdivision/neighborhood matches one of our communities
(`matchCommunitySlug` in `src/content/communities.ts`).

## Follow Up Boss (CRM) integration

Two independent Follow Up Boss (FUB) hooks are wired in: a **server-side lead
API** (needs a secret key) and a **client-side tracking pixel** (live by
default). Configure them in **Vercel → Project → Settings → Environment
Variables**.

| Variable | Purpose |
| --- | --- |
| `FUB_API_KEY` | Server-side, **required to store leads** (it's a secret — never commit it). Sends contact-form submissions to the FUB Events API (`src/app/api/lead/route.ts`). Without it, forms still submit but no lead is stored. |
| `NEXT_PUBLIC_FUB_PIXEL_ID` | **Optional override** for the tracking pixel (`src/components/FollowUpBossPixel.tsx`). Defaults to the live pixel `WT-HKVXTYFU`; set this only to point a non-production environment at a different pixel. |

**Tracking pixel:** live by default — the ID is baked into the component, since a
pixel ID is a public value that ships in the page HTML (not a secret). It loads
on every page and reports a pageview on each in-app navigation, so the full
browsing path is captured, not just the landing page. It ties site browsing to a
FUB contact — powering "your lead just viewed X" agent notifications and
activity-based Action Plans. The snippet is FUB's official Widget Tracker code
from **Admin → Pixel**; if FUB ever changes that snippet, update
`src/components/FollowUpBossPixel.tsx` to match.

Remarketing flow this enables: email/text your FUB database → contact clicks a
link to the site → pixel attributes their browsing to their FUB record → FUB
notifies the assigned agent and triggers any Action Plans / pond routing.

## Lead sweep engine (internal Battr)

A daily audit of the FUB database that finds leads the assigned agent has gone
quiet on, nudges them, and sweeps the ones past the neglect line into a pond —
the in-house replacement for the paid Battr subscription.

```bash
npm run battr:test              # rule engine self-test, no API key needed
npm run battr:dry               # full audit against live FUB, writes nothing
FUB_API_KEY=... BATTR_LIVE=true node scripts/battr-audit.mjs
```

**Tune the rules in `scripts/battr/rules.mjs`** — thresholds, sweep ponds,
protected stages and tags, exempt agents and sources. That file is the whole
policy surface; the engine is not meant to be edited to change behavior.

| How a lead is judged | |
| --- | --- |
| Last touch | The most recent **agent-initiated** call, text, or email. A lead contacting *us* is not a touch. Never-contacted leads run the clock from their creation date. |
| At Risk | Past the warn threshold with no touch → a note lands on the lead and `Battr At Risk Since` is stamped. Re-flagging is skipped on later runs. |
| Neglected | Past the sweep threshold **and already warned** → reassigned to the sweep pond, with a note recording who had it. |
| Excluded | Protected stages (under contract, closed), DNC-family tags, exempt agents, leads newer than `minLeadAgeDays`, and leads already sitting in a pond. |

### The two rules that matter most

**The warn-first interlock** (`requireWarningBeforeSweep`, on by default). A lead is
never swept unless an earlier run already warned the agent and stamped
`Battr At Risk Since`. Without it, a lead that has simply been quiet for a long
time gets taken away with no warning ever issued. Leave it on.

**Day filters.** Notes go out every day; sweeps only run Tuesday–Friday
(`sweepDayFilter: "Weekdays Excluding Monday"`), so the weekend's backlog gets one
working day of agent attention before anything is taken away. A blocked day is
recorded in the report as a skip, never silently dropped.

### Two modes

`rules.mode` selects how leads are classified:

- **`"simple"`** (default) — one global threshold pair across the database. Needs
  no list configuration.
- **`"lists"`** — the faithful model. Each list in `scripts/battr/lists.mjs`
  carries its own thresholds, written in the same filter JSON the live system
  uses, and the combined list unions them worst-status-wins. Thresholds are
  genuinely per-segment: Hot Leads warn at 2 days and sweep at 4, while Active
  Leads warn at 6 and sweep at 9.

List mode is not yet at full parity — four member lists of
`⭐️ Team Leads (Nudges & Sweeps)` (ids 1106–1109) still need their rule JSON
exported. The engine warns loudly when it runs without them.

**Safety.** Every run is a dry run unless `BATTR_LIVE=true` — the scheduled
workflow stays in shadow mode until the repo variable `BATTR_LIVE` is set to
`true`. Sweeps are capped per run (`maxSweepsPerRun`), and every sweep is written
to `battr-logs/<run-id>.json`, so a bad run is fully reversible:

```bash
node scripts/battr-audit.mjs --undo=2026-09-01-a1b2
```

**Scheduling:** the `Battr audit` GitHub Action
(`.github/workflows/battr-audit.yml`) runs it at 7 PM PT daily and commits the
report + audit trail to `battr-logs/`. You can also trigger it from the
**Actions** tab, choosing dry or live and which stage to run.

### Telling the agents

The nudge note lands on the lead; the **agent digest** is what tells the person
who owns it. Without it, the first an agent hears about a neglected lead is when
it vanishes from their pipeline — which is how a sweep automation loses a team's
trust. Set `BATTR_ALERT_CHANNEL`:

- **`report_only`** (default) — digests appear in the daily report only.
- **`fub_task`** — one task per agent inside FUB, attached to their most overdue
  lead. No email setup, and tasks notify only the assignee (unlike notes, which
  email the whole team).
- **`email`** — one email per agent. Needs `RESEND_API_KEY` and an email address
  on each FUB user record.

Agents in `excludeOwnerGroupIds` never get alerts and their leads are never swept.

### At Bats

Every run diffs lead ownership against the previous run and records the changes:
a brand-new lead assigned, a pond claim, or a transfer. That's the denominator
for the only question worth asking at review time — of the chances this agent
got, how many did they convert, and how many did they keep? Sweeps we caused are
excluded, since taking a lead away isn't a chance anyone was given.

The report carries per-agent conversion and retention. Undefined rates render as
`--`, never a misleading `0%`.

Tracking accrues **forward** from the first run — it can't see history it wasn't
running for. Export At Bats from Battr **before the subscription lapses** and
seed it:

```bash
node scripts/battr/import-atbats.mjs ~/Downloads/at-bats.csv --dry   # check the column mapping
node scripts/battr/import-atbats.mjs ~/Downloads/at-bats.csv         # import
```

| Variable | Where | Purpose |
| --- | --- | --- |
| `FUB_API_KEY` | Actions secret | Required. Same key as the site's lead intake. |
| `BATTR_ALERT_CHANNEL` | Actions variable | `report_only` (default), `fub_task`, or `email`. |
| `BATTR_LIVE` | Actions variable | Set to `true` to let the schedule write. Unset = shadow mode. |
| `BATTR_SMART_LIST_ID` | Actions variable | Optional. Audit one FUB smart list instead of the whole database. |
| `BATTR_REPORT_TO` | Actions variable | Optional. Where the daily report is emailed. |
| `RESEND_API_KEY` | Actions secret | Optional. Enables emailing the report. |
| `BATTR_WEBHOOK_URL` | Actions secret | Optional. Posts the report to a Slack incoming webhook. |

> The report is always written to `battr-logs/` and to the GitHub Actions job
> summary, so it survives even with no email or Slack configured.

## Blog auto-drafting engine

Give it a topic and it writes a full, SEO-optimized, internally-linked post
with a branded cover and drops it into `src/content/blog.ts` + `public/blog/`.
The script is `scripts/draft-blog-post.mjs`.

**Hands-off (Claude writes it) — needs `ANTHROPIC_API_KEY`:**

```bash
ANTHROPIC_API_KEY=... node scripts/draft-blog-post.mjs \
  --topic "How Henderson guard-gated communities compare" \
  --category "Buying Guides"
npm run build   # verify, then commit
```

**From a post you wrote yourself (no API key):**

```bash
node scripts/draft-blog-post.mjs --from-json ./post.json
```

Flags: `--category` (optional; one of New Construction / Market Updates /
Buying Guides / Selling Guides), `--date YYYY-MM-DD` (defaults to today),
`--dry` (print the generated post without writing anything).

What the engine does for you: generates a URL slug, estimates read time,
creates a branded SVG cover at `public/blog/<slug>.svg`, validates the SEO
title/description lengths and that the slug is unique, and inserts the post at
the top of the `blogPosts` array. Body text supports `**bold**` and
`[label](/internal-path)` links, which render as real links (see
`src/lib/prose.tsx`) — good for the internal-link graph.

**Fully automated (topic → PR):** the `Draft blog post` GitHub Action
(`.github/workflows/blog-draft.yml`) lets you run it from the repo's **Actions**
tab — type a topic and it opens a PR with the post + cover. Add one repo secret
first: **Settings → Secrets and variables → Actions → `ANTHROPIC_API_KEY`**.
Uncomment the `schedule:` block in that file to auto-draft on a cadence.

> Model: defaults to `claude-sonnet-5`; override with `BLOG_MODEL`.
> Covers are on-brand SVGs today; swap in real photography per post by setting
> `coverImage` to any image path under `public/`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
