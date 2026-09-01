# Organic Traffic Launch Checklist — rolandluxury.com

The site's technical SEO is already built (sitemap, robots + AI crawlers, JSON-LD,
unique titles, canonical URLs). What's left is **getting Google to discover, index,
and trust the site** — which is operational, not code. Work these in order; the top
three are the ones that actually move the needle for a brand-new domain.

---

## 1. Google Search Console — DO THIS FIRST ⭐
Without this, Google indexes slowly and you're blind to what's happening.

- [ ] Go to **search.google.com/search-console** → *Add property*.
- [ ] Choose the **Domain** property type, enter `rolandluxury.com`.
- [ ] Google gives you a **TXT record** to add to DNS. Add it wherever the domain's
      DNS lives (Vercel, GoDaddy, Cloudflare, etc.) → *Verify*.
  - *Tip:* if DNS is a hassle, use the **URL-prefix** property (`https://www.rolandluxury.com`)
    and verify with the **HTML tag** method — send me the tag and I'll drop it in the
    site's `<head>` in one commit.
- [ ] Once verified: **Sitemaps** → submit `sitemap.xml`.
- [ ] **URL Inspection** → paste `https://www.rolandluxury.com` → *Request indexing*.
      Repeat for 5–10 of your most important pages (home, /communities, top community
      pages, /home-value, /calculators).

## 2. Google Business Profile — the #1 LOCAL lever ⭐
For real estate, the Map Pack drives more calls than classic organic. This is huge.

- [ ] Claim/verify at **business.google.com**.
- [ ] Make the **Name, Address, Phone match the site EXACTLY**:
  - Roland Luxury / The Roland Team | LPT Realty
  - 5860 S Pecos Rd, Las Vegas, NV 89120
  - (702) 793-2158
  - *(If any of these are wrong, tell me — they must match `src/lib/site.ts` exactly.)*
- [ ] Primary category: **Real Estate Agency** (add *Real Estate Agent*).
- [ ] Add the website URL `https://www.rolandluxury.com`, service areas (Las Vegas,
      Henderson, Summerlin, North Las Vegas, Boulder City), hours, and photos.
- [ ] Link your Google reviews here — this is also what backs the 5★ review count.

## 3. Content velocity (I drive this in code)
More quality pages = more searches you can rank for. You're at ~105 pages; the goal
is to close the gap the same way big agent sites did — volume + depth.

- [ ] Turn on the **weekly auto-blog** (needs `ANTHROPIC_API_KEY` as a GitHub repo
      secret — Settings → Secrets → Actions).
- [ ] I'll mass-produce **neighborhood/area guides** targeting local search terms.

---

## 4. Bing Webmaster Tools
- [ ] **bing.com/webmasters** → add site → you can **import directly from Google
      Search Console** in one click → submit the same `sitemap.xml`.

## 5. Backlinks & citations (builds domain trust over time)
- [ ] Make sure your **Zillow, Realtor.com, Homes.com, Yelp** profiles link to
      rolandluxury.com. *(Zillow, Yelp, Instagram are already listed in the site's
      structured data — add Google Business Profile + Realtor.com when live.)*
- [ ] Get listed in local directories (Vegas Chamber, LPT Realty agent page, local
      press). Each quality link speeds up ranking.

## 6. Environment keys (unlocks the built-but-dormant tools)
In **Vercel → Settings → Environment Variables (Production)**, then redeploy:
- [ ] `REPLIERS_API_KEY` (+ `REPLIERS_BOARD_ID` if not 193) → live listings + AVM
- [ ] `SHOW_AVM_ESTIMATE=true` → show estimates on listing pages
- [ ] `FUB_API_KEY` → route leads into Follow Up Boss

---

### Reality check on timing
Even with all of the above done perfectly, a brand-new domain typically takes
**a few weeks to get indexed and 3–6 months to build meaningful organic traffic** for
competitive real-estate terms. Search Console + Business Profile + steady content are
what compress that timeline. This is normal — the site isn't broken, it's new.

### What needs YOU vs. ME
- **You:** #1 Search Console, #2 Business Profile, #4 Bing, #5 backlink profiles, #6 keys.
- **Me:** #3 content velocity, plus any `<head>` verification tags or code changes the
  above require — just send me the tag/value.
