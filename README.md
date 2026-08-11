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

Two independent Follow Up Boss (FUB) hooks are wired in. Both are controlled by
environment variables in **Vercel → Project → Settings → Environment Variables**
(they're secrets — never commit them), and both fail gracefully when unset so
the site works in dev/preview.

| Variable | Purpose |
| --- | --- |
| `FUB_API_KEY` | Server-side. Sends contact-form submissions to the FUB Events API (`src/app/api/lead/route.ts`). Without it, forms still submit but no lead is stored. |
| `NEXT_PUBLIC_FUB_PIXEL_ID` | Client-side tracking pixel (`src/components/FollowUpBossPixel.tsx`). Ties site browsing to a FUB contact — powering "your lead just viewed X" agent notifications and activity-based Action Plans. |

**Getting the Pixel ID:** in Follow Up Boss go to **Admin → Pixel** and copy the
tracking ID from the snippet it shows. Set `NEXT_PUBLIC_FUB_PIXEL_ID` to that ID
and redeploy — no code change. The pixel then loads on every page and reports a
pageview on each in-app navigation (so the full browsing path is captured, not
just the landing page). Confirm the FUB-provided snippet still uses the
`widgetbe.com/agent` loader and `widgetTracker` name; if FUB changes the format,
update `src/components/FollowUpBossPixel.tsx` to match.

Remarketing flow this enables: email/text your FUB database → contact clicks a
link to the site → pixel attributes their browsing to their FUB record → FUB
notifies the assigned agent and triggers any Action Plans / pond routing.

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
