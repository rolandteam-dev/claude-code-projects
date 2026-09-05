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
- `src/content/communities.ts` — community/neighborhood pages (the main traffic engine)
- `src/content/guides.ts` — buyer/seller/relocation guides
- `src/components/` — Header, Footer, Container, CommunityCard, JsonLd
- `src/app/communities/[slug]` — dynamic community pages w/ metadata + structured data
- `src/app/guides/[slug]` — dynamic guide pages
- `src/content/portal.ts` — Client Portal journeys (buyer/seller stages + tasks) and vendor categories
- `src/lib/portal/` — portal state (`store.ts`, browser-local), CRM engagement events (`track.ts`), progress math
- `src/components/portal/`, `src/app/(homeowner)/portal/` — the client hub (dashboard, journey, saved, numbers, pros). Roland Team-branded and noindex, like the homeowner dashboards; reached by invite link, not the marketing nav.
- `src/app/admin/clients` — internal portal dashboard (roster from FUB, hub-link builder, signal playbook); `src/lib/portal/roster.ts` is its server-side FUB read
- `src/app/sitemap.ts`, `src/app/robots.ts` — auto-generated
- `legacy/` — the old standalone HTML pages (pre-rebuild), kept for reference

## Adding content
- **New journey step / vendor:** add to `src/content/portal.ts`. Task ids are storage keys for client progress — **never renumber or reuse an id**.
- **New community:** add an object to `communities` in `src/content/communities.ts`. It automatically gets a page, sitemap entry, footer link, and structured data.
- **New guide:** add an object to `guides` in `src/content/guides.ts`.
- Keep facts general/verifiable; pricing is approximate — always route buyers to "contact for current availability."
- **SEO rules:** every page needs a unique `seoTitle` (~60 chars) and `seoDescription` (≤155 chars). Follow Fair Housing guidelines — describe places by objective attributes, never demographics.

## Commands
- `npm run dev` — local dev
- `npm run build` — production build (must pass before commit)
- `npm run lint` — eslint

## Environment variables
- `FUB_API_KEY` — Follow Up Boss; stores leads and portal engagement. Without it forms/portal still work, nothing is stored.
- `FUB_X_SYSTEM` / `FUB_X_SYSTEM_KEY` — FUB registered-system identity. Optional for most calls, **required** to register webhooks (`/api/admin/fub-webhook-setup`) — FUB 403s webhook registration with "X-System-Key header missing" otherwise. Request a system name + key from Follow Up Boss and set both; every FUB call then sends them.
- `ADMIN_TOKEN` — required for `/admin/sellers` and `/admin/clients`; gates all client data served to them.
- `HOMEOWNER_EMAIL_ENABLED` — must be exactly `"true"` or **no homeowner email sends at all** (welcome, cash offer, weekly digest). Off by default; see `docs/homeowner-engine-setup.md`.
- `HOMEOWNER_BASE_URL` — the Roland Team host. Homeowner dashboards, portal invite links and email links are all absolute against it.
- `REPLIERS_API_KEY` / `IDX_PROVIDER` — MLS feed selection (see `src/lib/idx/provider.ts`).

## Roadmap (next)
- Client Portal on real auth + a database (hubs that follow a client across devices; per-agent dashboard access)
- Live IDX/MLS listing search integration
- MDX blog pipeline wired to `/blog` (the daily draft task can publish here)
- Real photography/OG images per community
- Contact form with CRM lead routing
- Custom brand fonts (currently refined system stacks)
