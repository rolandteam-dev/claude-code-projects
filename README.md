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

**Event types:** FUB only accepts a fixed list of event types, and only some of
them start automations. `src/lib/fub.ts` is the single place that knows the
list — it maps our internal intent names (e.g. "Showing Request") onto a valid
type and keeps the original as a tag, so nothing is rejected and the team can
still filter on it in FUB.

| Intent | FUB event type | Starts action plans / AI texting |
| --- | --- | --- |
| Tour request, hot concierge lead | `Property Inquiry` | Yes |
| General contact form | `General Inquiry` | Yes |
| Home valuation | `Seller Inquiry` | Yes |
| Listing view (known contact) | `Viewed Property` | No — timeline + smart lists |
| Filtered search (known contact) | `Property Search` | No — timeline + smart lists |

## Proactive concierge (behavior-triggered outreach)

The concierge doesn't just wait to be asked — it watches how someone is
shopping and speaks first at the right moment. All tracking is client-side
(localStorage/sessionStorage in the visitor's own browser); no profile is
stored on a server and nothing identifies anyone until they hand over details.

**What it watches** (`src/lib/concierge/behavior.ts`): homes opened, the area
they keep returning to, the price band and bed count they're circling, filtered
searches, time on the home in front of them, repeat visits, and seller-side
pages.

**When it speaks** (`src/lib/concierge/triggers.ts`): rules in priority order —
lingering on one listing, three-plus homes in one area, a return visit, repeat
searches, exit intent, and a separate no-tour-pitch path for sellers. Each rule
fires at most once per visitor, with caps on messages per visit, a quiet gap
between them, and a back-off after two dismissals.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CONCIERGE_AGGRESSION` | `gentle`, `balanced` (default), or `assertive`. Sets the dwell/listing thresholds, how many proactive messages a visit can get, the back-off after a dismissal, and whether the chat panel opens itself (assertive, desktop only — never on a phone). |

**How it reaches the team** (`src/app/api/intent/route.ts`):

- *Already known* (they've submitted any form on the site from this browser —
  remembered by `src/lib/concierge/identity.ts`): accepting a tour offer posts a
  `Property Inquiry` straight to their FUB record. That's the type FUB starts
  action plans on, so the assigned agent is alerted and FUB's AI texting can
  fire without the visitor filling in anything. Their listing views and searches
  also flow in as `Viewed Property` / `Property Search`, once per home or search
  per visit.
- *Anonymous*: there's no FUB contact to attach to, so the concierge asks for a
  name and number first, then submits it as a `Property Inquiry` with the home
  and criteria attached.

To dial the whole thing back, set `NEXT_PUBLIC_CONCIERGE_AGGRESSION=gentle`; to
turn proactive messaging off entirely, remove `<BehaviorTracker />` from
`src/app/layout.tsx`.

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
