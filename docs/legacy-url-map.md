# Legacy URL map — AgentLoft → this app

`therolandteam.com` was served by AgentLoft before the marketing site moved to
this app. Those URLs are indexed and linked to, so every one that disappears at
cutover is lost rankings unless it is redirected or rebuilt.

**Status:** based on the old site's navigation only (~40 URLs). It is not a full
sitemap export. Before cutover, export the AgentLoft sitemap (or Search Console →
Pages → top pages by clicks), diff it against this list, and extend
`src/lib/legacyRedirects.ts`.

## Redirected (`src/lib/legacyRedirects.ts`)
- 24 community pages: `/{name}-real-estate` → `/communities/{slug}`
- City hubs: `/las-vegas-real-estate`, `/north-las-vegas-real-estate`,
  `/henderson-nv-real-estate`, `/boulder-city-real-estate`, `/cities` → `/areas/...`
- `/homes` → `/listings`, `/sell-your-home-las-vegas` → `/sell`,
  `/cash-offer-las-vegas` → `/cash-offer`, `/luxury-estates-las-vegas` →
  `/las-vegas-luxury-real-estate`, `/reviews` → `/testimonials`,
  `/payment-calculator` → `/calculators`
- `/first-time-home-buyers-las-vegas` → `/guides/first-time-home-buyer-las-vegas`
- `/out-of-state-buyers-las-vegas` → `/moving-to-las-vegas` (judgement call)

## Same path, nothing to do
`/about`, `/contact`, `/home-value`, `/mortgage-pre-approval`,
`/down-payment-assistance`, `/communities`, `/blog`, `/why-the-roland-team`,
`/guard-gated-communities-las-vegas`, `/golf-communities-las-vegas`

## Gaps — no equivalent in this app (will 404 at cutover)
Deliberately not redirected: sending them to an unrelated page reads as a soft 404.
Build the page here first, then add the redirect (or keep the same path).

- **Feature pages:** `/homes-with-pools-las-vegas`, `/homes-with-casitas-las-vegas`,
  `/homes-with-rv-garages-las-vegas`, `/single-story-homes-las-vegas`,
  `/high-rise-condos-las-vegas`
- **Communities not in `src/content/communities.ts`:**
  `/the-vistas-summerlin-real-estate`, `/macdonald-ranch-henderson-real-estate`,
  `/tuscany-henderson-real-estate`, `/madeira-canyon-henderson-real-estate`,
  `/whitney-ranch-henderson-real-estate`,
  `/valley-vista-north-las-vegas-real-estate`, `/the-fountains-henderson-real-estate`
- **Seller / program pages:** `/home-pricing-strategy-las-vegas`,
  `/guaranteed-home-sale-las-vegas`, `/love-it-or-leave-it`
- **Henderson pages:** `/henderson-number-1-real-estate-agent`,
  `/why-buy-in-henderson`, `/selling-your-henderson-home`
- **Individual listings:** `/home/{address-slug}-{id}` — AgentLoft's id is not this
  app's listing id (`/listings/[id]`), so these cannot be mapped mechanically.
- **Blog posts:** the post URLs were not visible from the nav. Compare AgentLoft
  post slugs with `src/content/blog.ts` once the sitemap is exported.
- **Agent pages:** this app has no per-agent pages or lead routing to each agent's
  own Follow Up Boss account.

## Tracking carried over
Google Tag Manager `GTM-KMV9VQFH` loads from `src/components/GoogleTagManager.tsx`
(it fires GA4 `G-274CW35DCF`). The second container AgentLoft loaded,
`GTM-P5TVXXCW`, carries a Google Ads tag and is not in Mike's GTM account; it is
**not** copied, so Ads conversions go unrecorded until that tag is recreated.
