@AGENTS.md

# The Roland Team — Las Vegas Real Estate Site

A from-scratch, SEO- and AI-reach-optimized real estate marketing site for
The Roland Team (Las Vegas & Henderson luxury real estate). Built to rank
organically for community/neighborhood and buyer/seller search terms.

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (theme tokens in `src/app/globals.css`)
- Fully **static / SSG** — every page prerenders to HTML for speed + SEO
- Deploy target: **Vercel**

## Structure
- `src/lib/site.ts` — global site config (name, URL, phone, nav). **Update contact + URL before launch.**
- `src/lib/schema.ts` — JSON-LD builders (RealEstateAgent, BreadcrumbList, FAQPage)
- `src/lib/fub.ts` — Follow Up Boss event types + posting (the only place that knows FUB's valid types)
- `src/lib/concierge/` — proactive chat: behavior tracking, trigger rules, identity, CRM hand-off
  (tune with `NEXT_PUBLIC_CONCIERGE_AGGRESSION`; see README)
- `src/content/communities.ts` — community/neighborhood pages (the main traffic engine)
- `src/content/guides.ts` — buyer/seller/relocation guides
- `src/components/` — Header, Footer, Container, CommunityCard, JsonLd
- `src/app/communities/[slug]` — dynamic community pages w/ metadata + structured data
- `src/app/guides/[slug]` — dynamic guide pages
- `src/app/sitemap.ts`, `src/app/robots.ts` — auto-generated
- `legacy/` — the old standalone HTML pages (pre-rebuild), kept for reference

## Adding content
- **New community:** add an object to `communities` in `src/content/communities.ts`. It automatically gets a page, sitemap entry, footer link, and structured data.
- **New guide:** add an object to `guides` in `src/content/guides.ts`.
- Keep facts general/verifiable; pricing is approximate — always route buyers to "contact for current availability."
- **SEO rules:** every page needs a unique `seoTitle` (~60 chars) and `seoDescription` (≤155 chars). Follow Fair Housing guidelines — describe places by objective attributes, never demographics.

## Commands
- `npm run dev` — local dev
- `npm run build` — production build (must pass before commit)
- `npm run lint` — eslint

## Roadmap (next)
- Live IDX/MLS listing search integration
- MDX blog pipeline wired to `/blog` (the daily draft task can publish here)
- Real photography/OG images per community
- Contact form with CRM lead routing
- Custom brand fonts (currently refined system stacks)
