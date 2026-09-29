# Battr audit — 2026-09-28 (DRY RUN — nothing was written)

Run `2026-09-28-bjwb` · **810 leads audited** of 54082 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **87** (0 new notes, 0 already flagged)
- Neglected: **12** (0 swept, 0 held back)
- Excluded: **10860** (10849 never entered the audit list, 11 removed after it)
- Email counted as work: **919 manual**, 3339 automated (ignored), 0 undetermined — of 4258 row(s) read, 0 unusable
  - origin fields present on the sample: `actionPlanId`, `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 123 → 87 and neglected 12 → 12
- Paused agents: **1** on `Battr Paused`, holding 3665 lead(s) back from nudges and sweeps
- **87 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **12 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **21 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **87** at risk against Battr's **14** (2026-09-27). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — not work, by your rule of 28 Sep | 51 | 59% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 56 | 64% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 29 | 33% |
| **None of the above** — Battr should be flagging these too | **0** | 0% |

**77 of 87** are expected differences — a drip-only lead or a divergent source, both by your choice. **10** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **0**, timeframe-change timestamps on **8702**, of 54082 FUB records (`timeframeUpdated` 8702). **Stage changes are invisible to us** — FUB sends no stage-changed date on the record.

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 12 | 7 (58%) | 0 |
| Only we flag them | 75 | 44 (59%) | 29 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Eric Graham | 20 | 20 | 15 | 0 | 0 |
| Shantele Marcum | 15 | 0 | 2 | 14 | 0 |
| Patty Cierley | 12 | 5 | 6 | 6 | 0 |
| Lynda Hwang | 12 | 12 | 11 | 0 | 0 |
| Nik Sharapov | 4 | 2 | 4 | 2 | 0 |
| Bruce Schneider | 3 | 2 | 3 | 0 | 0 |
| Sylvia Landa | 3 | 0 | 3 | 0 | 0 |
| Nicole Miller | 3 | 2 | 1 | 2 | 0 |
| Kate Frihse | 2 | 2 | 2 | 0 | 0 |
| Quetza Adame | 2 | 0 | 0 | 2 | 0 |
| Resty Valdeleon | 2 | 1 | 2 | 0 | 0 |
| Anthony Ma | 2 | 1 | 2 | 0 | 0 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 26 |
| 👀 Quarterly Nurture | 93d | 20 |
| 🌱 Monthly Nurture | 33d | 18 |
| 🔥 Weekly Nurture | 10d | 11 |
| 😎 Bi-Weekly Nurture | 16d | 10 |
| 🌶️ Hot Leads | 2d | 2 |

### Leads Battr flagged in the last 3 days — do we agree?

Battr stamped **10** lead(s). We agree on **5** (3 at risk, 2 neglected); 4 compliant, 1 excluded. For a lead we call worked, "our last touch" is the thing we count that Battr does not.

| FUB ID | Agent | Battr stamped | Our verdict | Our last touch |
| ---: | --- | --- | --- | --- |
| 42505 | Patty Cierley | 2026-09-28 | compliant | text out, 33d ago |
| 62031 | Lynda Hwang | 2026-09-28 | neglected | call out, 67d ago |
| 66393 | Sylvia Landa | 2026-09-28 | compliant | call out, 33d ago |
| 68652 | Kenny Chung | 2026-09-28 | compliant | timeframe change, 33d ago |
| 95284 | Kate Frihse | 2026-09-28 | compliant | timeframe change, 33d ago |
| 100570 | Patty Cierley | 2026-09-28 | neglected | call out, 33d ago |
| 100603 | Patty Cierley | 2026-09-28 | excluded — protected source (Ylopo PPC+) | call out, 16d ago |
| 33044 | Sylvia Landa | 2026-09-27 | at risk | call out, 17d ago |
| 39613 | Bruce Schneider | 2026-09-27 | at risk | call out, 12d ago |
| 46446 | Anthony Ma | 2026-09-27 | at risk | call in, 94d ago |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Eric Graham | 316 | 20 | 0 | 0 |
| Shantele Marcum | 21 | 15 | 0 | 0 |
| Patty Cierley | 106 | 12 | 1 | 0 |
| Lynda Hwang | 26 | 12 | 1 | 0 |
| Nik Sharapov | 53 | 4 | 1 | 0 |
| Kate Frihse | 13 | 2 | 3 | 0 |
| Sylvia Landa | 28 | 3 | 1 | 0 |
| Nicole Miller | 15 | 3 | 1 | 0 |
| Anthony Ma | 33 | 2 | 1 | 0 |
| Misty Sumner | 17 | 2 | 1 | 0 |
| Bruce Schneider | 11 | 3 | 0 | 0 |
| Kenny Chung | 95 | 2 | 0 | 0 |
| Quetza Adame | 32 | 2 | 0 | 0 |
| Resty Valdeleon | 2 | 2 | 0 | 0 |
| Karen Valdivia | 8 | 0 | 1 | 0 |
| Martine Goldberg | 5 | 1 | 0 | 0 |
| Paul Arroyo | 4 | 1 | 0 | 0 |
| Ginger Pace | 4 | 0 | 1 | 0 |
| Liza Rivera | 3 | 1 | 0 | 0 |
| Jason Shawver | 9 | 0 | 0 | 0 |
| Karen Lakes | 6 | 0 | 0 | 0 |
| Jamie Zahorobsky | 2 | 0 | 0 | 0 |
| Adin Roland | 1 | 0 | 0 | 0 |

## Inbound, never answered (37)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Robert | Anthony Ma | 94 | Ylopo |
| Jose Lozoya | Misty Sumner | 92 | Ylopo Seller |
| Teddy Levi | Karen Lakes | 92 | Zillow Preferred |
| Angela Nickels | Misty Sumner | 85 | Zillow |
| Andrew Keter | Nicole Miller | 83 | HomeLight |
| Teal McMillan | Patty Cierley | 81 | Redfin |
| Michael Cook | Patty Cierley | 72 | Zillow Preferred |
| Rico | Eric Graham | 72 | Zillow Preferred |
| Riley A Merida | Sylvia Landa | 67 | Ylopo |
| Tubosun Ayodele | Jason Shawver | 51 | Ylopo PPC+ |
| Sabrina Ramirez | Lynda Hwang | 49 | Zillow Preferred |
| Michelle | Paul Arroyo | 48 | Zillow Preferred |
| Sara Avalos | Anthony Ma | 46 | Citywide Long Form |
| Rebecca Turner | Sylvia Landa | 35 | Realtor.com |
| Kimberly Carnell | Eric Graham | 34 | TheRolandTeam.com |
| Jose Hurtado | Anthony Ma | 33 | Zillow Preferred |
| Derick Griffith | Kenny Chung | 33 | Zillow Preferred |
| Jasmine Lopez | Martine Goldberg | 32 | Google PPC |
| Courtney Miller | Anthony Ma | 26 | Citywide Long Form |
| Wendy Hottel | Bruce Schneider | 25 | Bing PPC |
| Sharon Swift | Kenny Chung | 24 | Google PPC |
| Mia Bizov | Lynda Hwang | 20 | CallAction  > Riders |
| Ken Benson | Kenny Chung | 19 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 18 | TheRolandTeam.com |
| Hema Aware | Misty Sumner | 14 | Zillow Preferred |
| Logan Cole | Karen Valdivia | 14 | TheRolandTeam.com |
| Pamela Cyrnek | Patty Cierley | 14 | TheRolandTeam.com |
| Charlotte Mannino | Nicole Miller | 12 | Zillow Preferred |
| Benito Cobos | Nik Sharapov | 7 | Ylopo |
| Vartika Kaul | Eric Graham | 7 | TheRolandTeam.com |
| Mike Fisher | Bruce Schneider | 6 | Company Websites |
| Glenn Schwartz | Eric Graham | 4 | Company |
| Henry Makekau | Misty Sumner | 4 | Jeffery Dragovich |
| Africa Marquina | Karen Lakes | 3 | TheRolandTeam.com |
| Joseph Talamo | Patty Cierley | 3 | TheRolandTeam.com |
| Janice Wilson | Kenny Chung | 2 | Zillow.com |
| Norma Holloway | Kenny Chung | 2 | Inbound Call |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| my +plus leads | Portals & aggregators | 26 | 0 |
| Zillow Preferred | Zillow | 21 | 2 |
| TheRolandTeam.com | Website & organic | 7 | 2 |
| Ylopo | Portals & aggregators | 6 | 1 |
| zbuyer.com | Zillow | 1 | 4 |
| Google PPC | Paid search & social | 5 | 0 |
| Jeffery Dragovich | Team & internal | 4 | 0 |
| Citywide Long Form | Portals & aggregators | 2 | 1 |
| Steve Hawks | Team & internal | 3 | 0 |
| zBuyer | Zillow | 3 | 0 |
| Direct Connect PPC | Paid search & social | 2 | 0 |
| Company | Team & internal | 1 | 0 |
| Trulia | Portals & aggregators | 1 | 0 |
| Real Geeks | Portals & aggregators | 0 | 1 |
| Redfin | Portals & aggregators | 1 | 0 |
| Zillow.com | Zillow | 1 | 0 |
| Zillow | Zillow | 1 | 0 |
| Company Websites | Website & organic | 1 | 0 |
| Direct Traffic | Website & organic | 1 | 0 |
| Noah Cash Offer | Seller & valuation | 0 | 1 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 108 | 44 | (+145.5%) | 2026-09-03 ⚠ 25d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 25d older |
| 🎤 AI TEXT REPLIES | 11 | 10 | (+10.0%) | 2026-09-03 ⚠ 25d older |
| 📖 Current & Upcoming Clients | 487 | 451 | (+8.0%) | 2026-09-03 ⚠ 25d older |
| ⭐️ Team Leads (combined) | 810 | 768 | +5.5% | 2026-09-27 |
| ‼️ YLOPO IMPORTANT | 112 | 116 | (-3.4%) | 2026-09-03 ⚠ 25d older |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4083 | 4198 | (-2.7%) | 2026-09-03 ⚠ 25d older |
| 💛 Sphere & Past Clients | 3336 | 3332 | (+0.1%) | 2026-09-03 ⚠ 25d older |

> **7 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4083 | 4200 | 215 / 56 / 3812 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3336 | 3332 | 156 / 17 / 3163 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 112 | 116 | 45 / 17 / 50 | 64 / 8 / 44 |
| 🏹 Zillow Important | 108 | 44 | 24 / 7 / 77 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 487 | 451 | 151 / 22 / 314 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 11 | 10 | 4 / 2 / 5 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quetza Adame | 15 | 0 | 1 | 6.7% | 100.0% |
| Mike Roland | 374 | 0 | 18 | 4.8% | 84.2% |
| Kate Frihse | 21 | 0 | 1 | 4.8% | 85.7% |
| Nik Sharapov | 39 | 0 | 1 | 2.6% | 94.9% |
| Adin Roland | 1155 | 0 | 3 | 0.3% | 95.4% |
| Patty Cierley | 35 | 0 | 0 | 0.0% | 100.0% |
| Kenny Chung | 28 | 0 | 0 | 0.0% | 53.6% |
| Eric Graham | 26 | 0 | 0 | 0.0% | 92.3% |
| Sylvia Landa | 26 | 0 | 0 | 0.0% | 92.3% |
| Karen Valdivia | 18 | 0 | 0 | 0.0% | 100.0% |
| Misty Sumner | 16 | 0 | 0 | 0.0% | 93.8% |
| Paul Arroyo | 15 | 0 | 0 | 0.0% | 100.0% |
| Anthony Ma | 14 | 0 | 0 | 0.0% | 100.0% |
| Bruce Schneider | 10 | 0 | 0 | 0.0% | 70.0% |
| Jason Shawver | 7 | 0 | 0 | 0.0% | 85.7% |
| Martine Goldberg | 6 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Lynda Hwang | 4 | 0 | 0 | 0.0% | 100.0% |
| Nicole Miller | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-09-28-bjwb`