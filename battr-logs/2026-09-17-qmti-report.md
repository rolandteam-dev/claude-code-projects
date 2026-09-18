# Battr audit — 2026-09-17 (DRY RUN — nothing was written)

Run `2026-09-17-qmti` · **828 leads audited** of 53946 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


> ## ⚠ AN EXCLUSION IN THIS CONFIG PROTECTS NOBODY
>
> **Owner-group exclusion (group 52555 — "Battr Paused")** — Follow Up Boss returns neither `assignedUserGroupIds` nor `groupIds` on a person, confirmed against the live account. Every contact carries an empty array, so “not in that group” is true for everyone and the condition excludes nobody.
>
> The exemption that DOES work is `rules.exemptAgents`, matched on the assigned agent's name. Currently: Mike Roland. Putting an agent in a Follow Up Boss group or team will not protect their leads.


## Summary

- At Risk: **279** (0 new notes, 0 already flagged)
- Neglected: **18** (0 swept, 0 held back)
- Excluded: 824
- **279 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **18 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **22 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Eric Graham | 315 | 87 | 0 | 0 |
| Patty Cierley | 102 | 38 | 2 | 0 |
| Kenny Chung | 118 | 22 | 11 | 0 |
| Nik Sharapov | 51 | 25 | 0 | 0 |
| Quetza Adame | 29 | 19 | 0 | 0 |
| Lynda Hwang | 27 | 19 | 0 | 0 |
| Shantele Marcum | 22 | 15 | 0 | 0 |
| Nicole Miller | 18 | 9 | 0 | 0 |
| Anthony Ma | 33 | 7 | 0 | 0 |
| Misty Sumner | 16 | 7 | 0 | 0 |
| Sylvia Landa | 27 | 4 | 2 | 0 |
| Bruce Schneider | 11 | 4 | 2 | 0 |
| Martine Goldberg | 7 | 5 | 0 | 0 |
| Kate Frihse | 14 | 4 | 0 | 0 |
| Jason Shawver | 9 | 4 | 0 | 0 |
| Karen Lakes | 5 | 3 | 0 | 0 |
| Jamie Zahorobsky | 3 | 2 | 1 | 0 |
| Ginger Pace | 4 | 2 | 0 | 0 |
| Liza Rivera | 3 | 2 | 0 | 0 |
| Angel Angelov | 1 | 1 | 0 | 0 |
| Karen Valdivia | 7 | 0 | 0 | 0 |
| Resty Valdeleon | 4 | 0 | 0 | 0 |
| Paul Arroyo | 1 | 0 | 0 | 0 |
| Adin Roland | 1 | 0 | 0 | 0 |

## Inbound, never answered (45)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Michael Reisman | Eric Graham | 42 | Zillow |
| Tubosun Ayodele | Jason Shawver | 40 | Ylopo PPC+ |
| Michael Lim | Sylvia Landa | 38 | Zillow Preferred |
| Sabrina Ramirez | Lynda Hwang | 38 | Zillow Preferred |
| Michelle | Mike Roland | 37 | Zillow Preferred |
| Sara Avalos | Anthony Ma | 35 | Citywide Long Form |
| Janet Leblanc | Ginger Pace | 31 | Andrew the Home Buyer |
| Amanda Smith | Anthony Ma | 31 | Zillow Preferred |
| Wendell Jackson | Kenny Chung | 29 | zbuyer.com |
| Cesar Lopez Antonio | Jason Shawver | 26 | Zillow Preferred |
| Bernard Earl Fuller III | Patty Cierley | 25 | TheRolandTeam.com |
| Rebecca Turner | Sylvia Landa | 24 | Realtor.com |
| Jose Hurtado | Anthony Ma | 22 | Zillow Preferred |
| Derick Griffith | Kenny Chung | 22 | Zillow Preferred |
| Giquilla Pickens | Kenny Chung | 22 | Zillow Preferred |
| Jasmine Lopez | Martine Goldberg | 21 | Google PPC |
| Travetta Panton | Eric Graham | 21 | TheRolandTeam.com |
| Gabe Drapel | Nik Sharapov | 19 | zbuyer.com |
| Irene And JR DiCarlo | Mike Roland | 18 | Zillow Preferred |
| Molly Roland | Mike Roland | 17 | Zillow |
| Andrew Corales | Mike Roland | 17 | Mike Roland Direct Lead |
| Juan Valencia | Patty Cierley | 17 | Citywide Long Form |
| Ms.Taylor | Sylvia Landa | 16 | Trulia |
| Courtney Miller | Anthony Ma | 15 | Citywide Long Form |
| Kimberly Carnell | Eric Graham | 14 | TheRolandTeam.com |
| Cheryl Robinson | Patty Cierley | 14 | Ylopo |
| Wendy Hottel | Bruce Schneider | 14 | Bing PPC |
| Sharon Swift | Kenny Chung | 13 | Google PPC |
| Mia Bizov | Lynda Hwang | 9 | CallAction  > Riders |
| Ryan Medina | Nicole Miller | 8 | Zillow Preferred |
| Ryan Stearns | Kenny Chung | 8 | TheRolandTeam.com |
| Ken Benson | Kenny Chung | 8 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 7 | TheRolandTeam.com |
| Esmeralda Narravarro | Sylvia Landa | 6 | ISA Transfer |
| Stephanie Buell | Misty Sumner | 6 | Zillow Preferred |
| Tammie Tammie | Mike Roland | 5 | Noah Cash Offer |
| Cliffe King | Patty Cierley | 5 | zbuyer.com |
| Hema Aware | Misty Sumner | 3 | Zillow Preferred |
| Tim Moore | Mike Roland | 3 | Zillow |
| Logan Cole | Karen Valdivia | 3 | TheRolandTeam.com |
| Mary Henneberger | Quetza Adame | 3 | zbuyer.com |
| Pamela Cyrnek | Patty Cierley | 3 | TheRolandTeam.com |
| Tom Courtright | Jason Shawver | 3 | TheRolandTeam.com |
| No name | Mike Roland | 2 | Noah Cash Offer |
| Craig Williams | Eric Graham | 2 | Zillow Preferred |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| Zillow Preferred | Zillow | 65 | 4 |
| my +plus leads | Portals & aggregators | 44 | 0 |
| TheRolandTeam.com | Website & organic | 34 | 0 |
| Ylopo | Portals & aggregators | 31 | 1 |
| Google PPC | Paid search & social | 24 | 1 |
| zbuyer.com | Zillow | 22 | 0 |
| Zillow | Zillow | 6 | 10 |
| Jeffery Dragovich | Team & internal | 8 | 0 |
| zBuyer | Zillow | 7 | 0 |
| Citywide Long Form | Portals & aggregators | 5 | 0 |
| Steve Hawks | Team & internal | 3 | 0 |
| Redfin | Portals & aggregators | 2 | 0 |
| Ylopo LSA | Portals & aggregators | 2 | 0 |
| Zillow.com | Zillow | 2 | 0 |
| Direct Traffic | Website & organic | 2 | 0 |
| Rocket Agents | Portals & aggregators | 2 | 0 |
| Direct Connect PPC | Paid search & social | 2 | 0 |
| CallAction  > Riders | Signs & mailers | 1 | 1 |
| ISA Transfer | Team & internal | 1 | 0 |
| OJO | Portals & aggregators | 1 | 0 |
| Leadpops - Google Ads | Paid search & social | 1 | 0 |
| Inbound Call | Team & internal | 1 | 0 |
| Sierra | Portals & aggregators | 1 | 0 |
| Opcity | Portals & aggregators | 1 | 0 |
| Google Lsa | Paid search & social | 1 | 0 |
| Realtor.com | Portals & aggregators | 1 | 0 |
| Quali | Portals & aggregators | 1 | 0 |
| Company Websites | Website & organic | 1 | 0 |
| Chris Casiello | Team & internal | 1 | 0 |
| CallAction  > SlyDial | Signs & mailers | 1 | 0 |
| Direct Call | Team & internal | 0 | 1 |
| Ylopo Seller | Portals & aggregators | 1 | 0 |
| For Sale Signs | Signs & mailers | 1 | 0 |
| HomeLight | Portals & aggregators | 1 | 0 |
| LPT Rider | Signs & mailers | 1 | 0 |
| Noah Cash Offer | Seller & valuation | 1 | 0 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 140 | 44 | +218.2% | 2026-09-03 |
| ❗Active Leads | 0 | 131 | -100.0% | 2026-09-03 |
| 🎤 AI TEXT REPLIES | 11 | 10 | +10.0% | 2026-09-03 |
| ⭐️ Team Leads (combined) | 828 | 880 | -5.9% | 2026-09-15 |
| 📖 Current & Upcoming Clients | 467 | 451 | +3.5% | 2026-09-03 |
| ‼️ YLOPO IMPORTANT | 112 | 116 | -3.4% | 2026-09-03 |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4061 | 4198 | -3.3% | 2026-09-03 |
| 💛 Sphere & Past Clients | 3334 | 3332 | +0.1% | 2026-09-03 |

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4061 | 4200 | 112 / 82 / 3867 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3334 | 3332 | 81 / 0 / 3253 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 112 | 116 | 44 / 9 / 59 | 64 / 8 / 44 |
| 🏹 Zillow Important | 140 | 44 | 16 / 7 / 117 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 467 | 451 | 126 / 7 / 334 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 11 | 10 | 6 / 2 / 3 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 14 | 0 | 1 | 7.1% | 100.0% |
| Mike Roland | 356 | 0 | 18 | 5.1% | 94.4% |
| Nik Sharapov | 25 | 0 | 1 | 4.0% | 92.0% |
| Adin Roland | 544 | 0 | 2 | 0.4% | 96.0% |
| Sylvia Landa | 21 | 0 | 0 | 0.0% | 95.2% |
| Kenny Chung | 20 | 0 | 0 | 0.0% | 95.0% |
| Patty Cierley | 19 | 0 | 0 | 0.0% | 100.0% |
| Eric Graham | 18 | 0 | 0 | 0.0% | 100.0% |
| Karen Valdivia | 13 | 0 | 0 | 0.0% | 100.0% |
| Quetza Adame | 11 | 0 | 0 | 0.0% | 100.0% |
| Anthony Ma | 10 | 0 | 0 | 0.0% | 100.0% |
| Bruce Schneider | 7 | 0 | 0 | 0.0% | 71.4% |
| Misty Sumner | 7 | 0 | 0 | 0.0% | 100.0% |
| Martine Goldberg | 5 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Jason Shawver | 4 | 0 | 0 | 0.0% | 100.0% |
| Lynda Hwang | 3 | 0 | 0 | 0.0% | 100.0% |
| Paul Arroyo | 3 | 0 | 0 | 0.0% | 100.0% |
| Nicole Miller | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-09-17-qmti`