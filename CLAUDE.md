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
- `ADMIN_TOKEN` — required for `/admin/sellers` and `/admin/clients`; gates all client data served to them. Also gates the read-only `/api/admin/audit-homeowners?key=…` endpoint, which buckets the homeowner store by eligibility (eligible / invalid-email / out-of-state / unknown-location) and reports counts, samples, and the top out-of-state states — it writes nothing.
- `HOMEOWNER_EMAIL_ENABLED` — must be exactly `"true"` or **no homeowner email sends at all** (welcome, cash offer, weekly digest). Off by default; see `docs/homeowner-engine-setup.md`.
- `HOMEOWNER_DIGEST_BATCH` — how many due homeowners `/api/cron/homeowner-digest` mails per run (default 50, hard max 1000; `?limit=` overrides per request). The digest also re-checks eligibility at send time, so ineligible rows already in the table are never mailed. Keep this modest to protect a young sending domain.
- `HOMEOWNER_BASE_URL` — the Roland Team host. Homeowner dashboards, portal invite links, and email links are all absolute against it — and `/api/admin/fub-webhook-setup` now registers the FUB webhook against this origin too (falling back to `site.url`), so the receiver is on the Roland Team host, not the marketing site.
- `REPLIERS_API_KEY` / `IDX_PROVIDER` — MLS feed selection (see `src/lib/idx/provider.ts`).
- `AGENT_ALERTS_ENABLED` / `AGENT_ALERT_TO` / `AGENT_ALERT_TAGS` / `FUB_ACCOUNT_SUBDOMAIN` — hot-lead agent alerts (`src/lib/homeowners/agentAlert.ts`, fired from `/api/lead`). When a homeowner takes a high-intent dashboard action, the assigned FUB agent is emailed (via Resend) with the lead's details + a link to their FUB record. **Off by default.** Set `AGENT_ALERT_TO` to route ALL alerts to one inbox (use your own to test); set `AGENT_ALERTS_ENABLED="true"` to send to each lead's assigned agent (team email fallback when unassigned). `AGENT_ALERT_TAGS` (CSV) overrides which tags count as hot (default: `Requested CMA, Cash Offer, List With Us, Equity Calculator, Buyer Lead`). `FUB_ACCOUNT_SUBDOMAIN` builds the FUB deep link (default `therolandteam1`). Needs `RESEND_API_KEY` + `FUB_API_KEY`.
- `RESEND_WEBHOOK_SECRET` — Resend webhook signing secret (`whsec_…`). **Required** for `/api/webhooks/resend`, which forwards email opens and clicks to Follow Up Boss. The endpoint is public and writes to the CRM, so it fails closed: without this it 503s and every unsigned or replayed delivery is rejected. Set up in Resend → Webhooks (subscribe to `email.opened` + `email.clicked`).
- `FRED_API_KEY` — free St. Louis Fed key powering the homeowner dashboard's Mortgage Rate Trends module (30/15-yr fixed, weekly). Without it the module is simply hidden. Get one at https://fred.stlouisfed.org/docs/api/api_key.html.
- `GOOGLE_MAPS_API_KEY` — powers the homeowner dashboard's Recent Sales map (Static Maps, browser `<img>`). Restrict it by HTTP referrer — it appears in the map image URL. The map hides when unset.
- `GOOGLE_PLACES_API_KEY` — server-side key for the Google reviews module (Places Details, legacy endpoint — enable the classic **"Places API"**, not only "Places API (New)"). Because the call runs from Vercel with no Referer, this key must NOT be referrer-restricted (leave unrestricted or IP-restrict it). Falls back to `GOOGLE_MAPS_API_KEY` when unset, but a referrer-restricted Maps key will make reviews silently return null — hence the split.
- `GOOGLE_PLACE_ID` — the team's Google Business place id; with a Places key, drives the Contact Agent / Google reviews module (rating + recent reviews). Find it via Google's Place ID finder.
- `BUYING_VIDEO_ID` — YouTube video id for the homeowner dashboard's "Buying a Home" module (just the id, e.g. `DGQMJufo4l8`, not the full URL). Defaults to a sensible value; set this to swap the video without a code change.
- `FUB_DASHBOARD_FIELD` — FUB custom-field API key that receives each homeowner's private dashboard link. When set, every homeowner activity event (`src/lib/homeowners/fubActivity.ts`) writes `home.therolandteam.com/dashboard/<token>` into that field, so agents can click straight to the lead's dashboard from the FUB contact. Create the field in FUB → Admin → Custom Fields, find its exact API key via the read-only `/api/admin/fub-custom-fields?key=ADMIN_TOKEN` endpoint, and set it here. Unset = link not written.

## Gotchas (Repliers / estimator)
- **`class` is NOT detached-vs-attached on GLVAR.** Detached homes in an HOA/PUD are filed under `CondoProperty`, so filtering the comp query by `class=ResidentialProperty` (for "Single Family") returned an empty bucket across ~half the valley (Summerlin, Anthem, Green Valley, Southern Highlands, Mountain's Edge). `src/lib/idx/estimate.ts` no longer sends `class`; it pulls all comps and classifies each in-app (`styleWantFor` / `styleTextOf` / `matchesStyle`), **failing open** — a comp is dropped only when its own style text positively reads as attached. The style field names vary by MLS; `/api/admin/estimate-test?...&comps=1` dumps the `byStyle` map + sample `details` to find the real ones.
- **Repliers `status` takes a single value.** `status=A,U` 400s — use one (`U` for sold comps).
- **The `/estimates` (AVM) POST requires a `details` object** (beds/baths/sqft); omitting it 400s.

## Roadmap (next)
- Client Portal on real auth + a database (hubs that follow a client across devices; per-agent dashboard access)
- Live IDX/MLS listing search integration
- MDX blog pipeline wired to `/blog` (the daily draft task can publish here)
- Real photography/OG images per community
- Contact form with CRM lead routing
- Custom brand fonts (currently refined system stacks)
