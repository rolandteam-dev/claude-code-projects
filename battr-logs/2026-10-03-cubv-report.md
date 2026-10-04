# Battr audit — 2026-10-03 (DRY RUN — nothing was written)

Run `2026-10-03-cubv` · **822 leads audited** of 54137 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **72** (0 new notes, 0 already flagged)
- Neglected: **5** (0 swept, 0 held back)
- Excluded: **10859** (10859 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **9** since the last run, **45** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **122** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Email counted as work: **169 manual**, 1317 automated (ignored), 0 undetermined — of 1486 row(s) read, 0 unusable
  - origin fields present on the sample: `actionPlanId`, `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 72 → 72 and neglected 5 → 5
- Paused agents: **1** on `Battr Paused`, holding 3664 lead(s) back from nudges and sweeps
- **72 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **5 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **19 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **72** at risk against Battr's **17** (2026-10-01). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 63 | 88% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 30 | 42% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 44 | 61% |
| **None of the above** — Battr should be flagging these too | **0** | 0% |

**44 of 72** are expected differences — the two sources you chose to sweep. **28** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **45**, timeframe-change timestamps on **8753**, of 54137 FUB records (`timeframeUpdated` 8753, `stageUpdated` 45).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 15 | 15 (100%) | 0 |
| Only we flag them | 57 | 48 (84%) | 44 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quetza Adame | 18 | 15 | 1 | 17 | 0 |
| Shantele Marcum | 15 | 11 | 2 | 14 | 0 |
| Nik Sharapov | 7 | 6 | 5 | 2 | 0 |
| Patty Cierley | 6 | 6 | 0 | 6 | 0 |
| Eric Graham | 6 | 6 | 6 | 0 | 0 |
| Nicole Miller | 4 | 4 | 2 | 3 | 0 |
| Sylvia Landa | 4 | 4 | 4 | 0 | 0 |
| Liza Rivera | 2 | 2 | 1 | 1 | 0 |
| Bruce Schneider | 2 | 1 | 2 | 0 | 0 |
| Kate Frihse | 2 | 2 | 2 | 0 | 0 |
| Misty Sumner | 1 | 1 | 1 | 0 | 0 |
| Lynda Hwang | 1 | 1 | 1 | 0 | 0 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 40 |
| 🌱 Monthly Nurture | 33d | 8 |
| 🔥 Weekly Nurture | 10d | 7 |
| 👀 Quarterly Nurture | 93d | 7 |
| 😎 Bi-Weekly Nurture | 16d | 6 |
| 🌶️ Hot Leads | 2d | 4 |

### Leads Battr flagged in the last 3 days — do we agree?

Battr stamped **14** lead(s). We agree on **13** (12 at risk, 1 neglected); 1 compliant. For a lead we call worked, "our last touch" is the thing we count that Battr does not.

| FUB ID | Agent | Battr stamped | Our verdict | Our last touch | Window | Stage · timeframe id · source |
| ---: | --- | --- | --- | --- | ---: | --- |
| 36342 | Sylvia Landa | 2026-10-03 | at risk | timeframe change, 33.3d ago | 33d | Nurture · 3 · Google PPC |
| 39721 | Kate Frihse | 2026-10-03 | at risk | call out, 33.2d ago | 33d | Nurture · 3 · Zillow.com |
| 56155 | Nicole Miller | 2026-10-03 | at risk | call out, 33.4d ago | 33d | Nurture · 3 · Zillow.com |
| 85071 | Nik Sharapov | 2026-10-03 | at risk | call out, 16.1d ago | 16d | Nurture · 2 · Zillow Preferred |
| 99406 | Sylvia Landa | 2026-10-03 | compliant | timeframe change, 8.8d ago | 16d | Nurture · 2 · Zillow Preferred |
| 100799 | Sylvia Landa | 2026-10-03 | neglected | call out, 14.2d ago | 10d | Attempted Contact · 1 · Zillow Preferred |
| 100869 | Misty Sumner | 2026-10-03 | at risk | call out, 10.3d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 101316 | Kate Frihse | 2026-10-03 | at risk | text out, 2.4d ago | 2d | Lead · none · Zillow Preferred |
| 33025 | Sylvia Landa | 2026-10-02 | at risk | text out, 17.3d ago | 16d | Nurture · 2 · Jeffery Dragovich |
| 89981 | Quetza Adame | 2026-10-02 | at risk | call out, 11.2d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 95511 | Jamie Zahorobsky | 2026-10-02 | at risk | text out, 94.3d ago | 93d | Nurture · 4 · Ylopo |
| 99493 | Liza Rivera | 2026-10-02 | at risk | call out, 94d ago | 93d | Spoke with Customer · 4 · Citywide Long Form |
| 100355 | Bruce Schneider | 2026-10-02 | at risk | call out, 11.2d ago | 10d | Lead · none · HomeLight |
| 101255 | Sylvia Landa | 2026-10-02 | at risk | text out, 3.1d ago | 2d | Attempted Contact · none · TheRolandTeam.com |

- Email-date rule check: **0 of 21** leads Battr flagged have a Follow Up Boss last-email date inside their window, as the rule assumes.

### Which Follow Up Boss date field is Battr's "last communication"?

Battr calls the 13 leads only we flag fine, so for most of them its field must be newer than the lead's window — and older for the 21 leads it flagged. A date field on the FUB record that does that is the candidate. Dates only.

| FUB date field | Inside window — only us | Inside window — Battr-flagged |
| --- | ---: | ---: |
| `lastSentInboxAppMessage` | 12 of 13 (92%) | 0 of 21 (0%) |
| `lastInboxAppMessage` | 12 of 13 (92%) | 0 of 21 (0%) |

### What sets the 13 leads only we flag apart from the 21 Battr stamped in the last 7 days

A pointer, not a proof — the groups are small. Something far commoner on our side is a candidate for what Battr treats as work, or as out of scope.

| More common among leads only we flag | Only us | Battr-flagged |
| --- | ---: | ---: |
| has field: customTotalLogins | 9 (69%) | 6 (29%) |
| tag: Ylopo_Reactivated | 11 (85%) | 10 (48%) |
| has field: customTotalListingsViewed | 8 (62%) | 6 (29%) |
| has field: lastSentEmail | 10 (77%) | 10 (48%) |
| has field: lastSentEmailId | 10 (77%) | 10 (48%) |
| has field: socialData | 10 (77%) | 10 (48%) |
| lead age: over a year | 8 (62%) | 7 (33%) |
| has field: lastEmail | 11 (85%) | 12 (57%) |
| has field: lastEmailId | 11 (85%) | 12 (57%) |
| has field: lastSentInboxAppMessage | 12 (92%) | 14 (67%) |
| has field: lastSentInboxAppMessageId | 12 (92%) | 14 (67%) |
| has field: lastInboxAppMessage | 12 (92%) | 14 (67%) |

| More common among leads Battr flagged | Only us | Battr-flagged |
| --- | ---: | ---: |
| has field: customBattrAtRiskSince | 0 (0%) | 21 (100%) |
| has field: leadFlowId | 5 (38%) | 16 (76%) |
| has field: customBattrLastAssignment | 8 (62%) | 20 (95%) |
| tag: Buyer Consultation Series | 5 (38%) | 15 (71%) |
| tag: Summary Box Icons | 5 (38%) | 14 (67%) |
| has field: customYlopoListingAlert | 5 (38%) | 14 (67%) |

### At risk here, not flagged by Battr — 13 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 98100 | Bruce Schneider | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | call out, 56.3d ago |
| 30013 | Eric Graham | 🌱 Monthly Nurture | 33d | Nurture | Jeffery Dragovich | call out, 40.3d ago |
| 38253 | Eric Graham | 👀 Quarterly Nurture | 93d | Nurture | Google PPC | timeframe change, 313.2d ago |
| 39740 | Eric Graham | 🌱 Monthly Nurture | 33d | Nurture | Zillow.com | call out, 51.3d ago |
| 54807 | Eric Graham | 🌱 Monthly Nurture | 33d | Nurture | Sierra | email out, 37.2d ago |
| 57840 | Eric Graham | 😎 Bi-Weekly Nurture | 16d | Nurture | Google PPC | call out, 48.2d ago |
| 75656 | Eric Graham | 👀 Quarterly Nurture | 93d | Nurture | Ylopo | timeframe change, 184.3d ago |
| 74086 | Kenny Chung | 👀 Quarterly Nurture | 93d | Nurture | zBuyer | timeframe change, 375.1d ago |
| 74514 | Nik Sharapov | 👀 Quarterly Nurture | 93d | Nurture | Zillow Preferred | timeframe change, 336.3d ago |
| 99547 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | TheRolandTeam.com | timeframe change, 59d ago |
| 101313 | Nik Sharapov | 🌶️ Hot Leads | 2d | Attempted Contact | Zillow Preferred | call out, 2.3d ago |
| 101346 | Nik Sharapov | 🌶️ Hot Leads | 2d | Lead | YouTube | nothing in 100 days |
| 100312 | Shantele Marcum | 🔥 Weekly Nurture | 10d | Spoke with Customer | Citywide Long Form | call out, 19.1d ago |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Quetza Adame | 34 | 18 | 0 | 0 |
| Shantele Marcum | 22 | 15 | 0 | 0 |
| Nik Sharapov | 58 | 7 | 0 | 0 |
| Eric Graham | 319 | 6 | 0 | 0 |
| Patty Cierley | 111 | 6 | 0 | 0 |
| Sylvia Landa | 29 | 4 | 1 | 0 |
| Nicole Miller | 13 | 4 | 1 | 0 |
| Kate Frihse | 9 | 2 | 1 | 0 |
| Jason Shawver | 12 | 0 | 2 | 0 |
| Bruce Schneider | 9 | 2 | 0 | 0 |
| Liza Rivera | 4 | 2 | 0 | 0 |
| Kenny Chung | 96 | 1 | 0 | 0 |
| Anthony Ma | 32 | 1 | 0 | 0 |
| Lynda Hwang | 26 | 1 | 0 | 0 |
| Misty Sumner | 17 | 1 | 0 | 0 |
| Martine Goldberg | 6 | 1 | 0 | 0 |
| Jamie Zahorobsky | 2 | 1 | 0 | 0 |
| Karen Valdivia | 9 | 0 | 0 | 0 |
| Karen Lakes | 6 | 0 | 0 | 0 |
| Paul Arroyo | 4 | 0 | 0 | 0 |
| Ginger Pace | 3 | 0 | 0 | 0 |
| Adin Roland | 1 | 0 | 0 | 0 |

## Inbound, never answered (37)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Teddy Levi | Karen Lakes | 97 | Zillow Preferred |
| Angela Nickels | Misty Sumner | 90 | Zillow |
| Andrew Keter | Nicole Miller | 88 | HomeLight |
| Teal McMillan | Patty Cierley | 86 | Redfin |
| Rico | Eric Graham | 77 | Zillow Preferred |
| Riley A Merida | Sylvia Landa | 72 | Ylopo |
| Tubosun Ayodele | Jason Shawver | 56 | Ylopo PPC+ |
| Sabrina Ramirez | Lynda Hwang | 54 | Zillow Preferred |
| Rebecca Turner | Sylvia Landa | 40 | Realtor.com |
| Jose Hurtado | Anthony Ma | 38 | Zillow Preferred |
| Jasmine Lopez | Martine Goldberg | 37 | Google PPC |
| Wendy Hottel | Bruce Schneider | 30 | Bing PPC |
| Sharon Swift | Kenny Chung | 29 | Google PPC |
| Ken Benson | Kenny Chung | 24 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 23 | TheRolandTeam.com |
| Pamela Cyrnek | Patty Cierley | 19 | TheRolandTeam.com |
| Benito Cobos | Nik Sharapov | 12 | Ylopo |
| Vartika Kaul | Eric Graham | 12 | TheRolandTeam.com |
| Mike Fisher | Bruce Schneider | 11 | Company Websites |
| Henry Makekau | Misty Sumner | 9 | Jeffery Dragovich |
| Joseph Talamo | Patty Cierley | 8 | TheRolandTeam.com |
| Janice Wilson | Kenny Chung | 7 | Zillow.com |
| Norma Holloway | Kenny Chung | 7 | Inbound Call |
| Jesus Cisneros Barajas | Kenny Chung | 4 | Ylopo PPC+ |
| Keith Martinez | Patty Cierley | 4 | TheRolandTeam.com |
| Mihailo Jovanovic | Sylvia Landa | 3 | TheRolandTeam.com |
| Renees Mendoza | Eric Graham | 3 | Google PPC |
| Rogelio Valencia | Eric Graham | 3 | Citywide Long Form |
| Amanda Smith | Anthony Ma | 3 | Zillow Preferred |
| Louie Ocello | Misty Sumner | 3 | Ylopo |
| Angel Flores | Misty Sumner | 3 | Zillow Preferred |
| Michelle | Paul Arroyo | 2 | Zillow Preferred |
| Gabby Chumbe-Sandoval | Nik Sharapov | 2 | Google Lsa |
| Laura Reeves | Jason Shawver | 2 | Zillow Preferred |
| Philip Rossovich | Patty Cierley | 2 | zbuyer.com |
| Kathleen Bell | Eric Graham | 2 | TheRolandTeam.com |
| Darlene Rockey | Kate Frihse | 2 | Noah Cash Offer |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| my +plus leads | Portals & aggregators | 42 | 0 |
| Zillow Preferred | Zillow | 8 | 3 |
| Google PPC | Paid search & social | 4 | 0 |
| TheRolandTeam.com | Website & organic | 3 | 1 |
| Zillow.com | Zillow | 3 | 0 |
| Citywide Long Form | Portals & aggregators | 2 | 0 |
| Jeffery Dragovich | Team & internal | 2 | 0 |
| Steve Hawks | Team & internal | 2 | 0 |
| Ylopo | Portals & aggregators | 2 | 0 |
| HomeLight | Portals & aggregators | 1 | 0 |
| zbuyer.com | Zillow | 0 | 1 |
| Sierra | Portals & aggregators | 1 | 0 |
| zBuyer | Zillow | 1 | 0 |
| YouTube | Paid search & social | 1 | 0 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 147 | 44 | (+234.1%) | 2026-09-03 ⚠ 30d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 30d older |
| 📖 Current & Upcoming Clients | 490 | 451 | (+8.6%) | 2026-09-03 ⚠ 30d older |
| ‼️ YLOPO IMPORTANT | 108 | 116 | (-6.9%) | 2026-09-03 ⚠ 30d older |
| ⭐️ Team Leads (combined) | 822 | 777 | (+5.8%) | 2026-10-01 ⚠ 2d older |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4089 | 4198 | (-2.6%) | 2026-09-03 ⚠ 30d older |
| 💛 Sphere & Past Clients | 3341 | 3332 | (+0.3%) | 2026-09-03 ⚠ 30d older |
| 🎤 AI TEXT REPLIES | 10 | 10 | (0.0%) | 2026-09-03 ⚠ 30d older |

> **8 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4089 | 4200 | 297 / 59 / 3733 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3341 | 3332 | 227 / 1 / 3113 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 108 | 116 | 50 / 16 / 42 | 64 / 8 / 44 |
| 🏹 Zillow Important | 147 | 44 | 30 / 4 / 113 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 490 | 451 | 159 / 35 / 296 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 10 | 10 | 7 / 0 / 3 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quetza Adame | 17 | 0 | 1 | 5.9% | 100.0% |
| Mike Roland | 385 | 0 | 18 | 4.7% | 81.6% |
| Kate Frihse | 26 | 0 | 1 | 3.8% | 69.2% |
| Nik Sharapov | 52 | 0 | 1 | 1.9% | 96.2% |
| Adin Roland | 1403 | 0 | 3 | 0.2% | 95.0% |
| Patty Cierley | 45 | 0 | 0 | 0.0% | 97.8% |
| Sylvia Landa | 35 | 0 | 0 | 0.0% | 88.6% |
| Kenny Chung | 31 | 0 | 0 | 0.0% | 54.8% |
| Eric Graham | 29 | 0 | 0 | 0.0% | 93.1% |
| Misty Sumner | 26 | 0 | 0 | 0.0% | 92.3% |
| Paul Arroyo | 26 | 0 | 0 | 0.0% | 100.0% |
| Karen Valdivia | 22 | 0 | 0 | 0.0% | 95.5% |
| Anthony Ma | 16 | 0 | 0 | 0.0% | 100.0% |
| Bruce Schneider | 11 | 0 | 0 | 0.0% | 63.6% |
| Jason Shawver | 8 | 0 | 0 | 0.0% | 87.5% |
| Martine Goldberg | 6 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Lynda Hwang | 4 | 0 | 0 | 0.0% | 100.0% |
| Shantele Marcum | 2 | 0 | 0 | 0.0% | 100.0% |
| Nicole Miller | 1 | 0 | 0 | 0.0% | 100.0% |
| Liza Rivera | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-10-03-cubv`