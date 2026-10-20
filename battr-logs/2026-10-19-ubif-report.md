# Battr audit — 2026-10-19 (DRY RUN — nothing was written)

Run `2026-10-19-ubif` · **828 leads audited** of 51319 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **64** (0 new notes, 0 already flagged)
- Neglected: **11** (0 swept, 0 held back)
- Excluded: **10135** (10135 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **43** since the last run, **400** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **137** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Reactivated Ylopo leads (`Ylopo_Reactivated`) counted as worked on their last inbox message, to match Battr: **29** compliant lead(s) have it as their latest touch — none of them carry Battr's stamp, as expected
- Email counted as work: **102 manual**, 1088 automated (ignored), 0 undetermined — of 1190 row(s) read, 0 unusable
  - origin fields present on the sample: `actionPlanId`, `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 64 → 64 and neglected 11 → 11
- Paused agents: **1** on `Battr Paused`, holding 3674 lead(s) back from nudges and sweeps
- **64 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **11 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **17 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **64** at risk against Battr's **14** (2026-10-07). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 31 | 48% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 18 | 28% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 45 | 70% |
| **None of the above** — Battr should be flagging these too | **4** | 6% |

**45 of 64** are expected differences — the two sources you chose to sweep. **19** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **400**, timeframe-change timestamps on **8467**, of 51319 FUB records (`timeframeUpdated` 8467, `stageUpdated` 400).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 14 | 5 (36%) | 0 |
| Only we flag them | 50 | 26 (52%) | 45 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quetza Adame | 19 | 10 | 1 | 18 | 0 |
| Shantele Marcum | 14 | 8 | 0 | 14 | 0 |
| Patty Cierley | 13 | 5 | 3 | 6 | 2 |
| Kenny Chung | 4 | 2 | 3 | 1 | 0 |
| Anthony Ma | 3 | 1 | 2 | 1 | 1 |
| Nicole Miller | 3 | 2 | 3 | 3 | 0 |
| Sylvia Landa | 3 | 0 | 3 | 0 | 0 |
| Liza Rivera | 1 | 0 | 0 | 1 | 0 |
| Misty Sumner | 1 | 0 | 0 | 0 | 1 |
| Kate Frihse | 1 | 1 | 1 | 0 | 0 |
| Martine Goldberg | 1 | 1 | 1 | 1 | 0 |
| Ginger Pace | 1 | 1 | 1 | 0 | 0 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 45 |
| 😎 Bi-Weekly Nurture | 16d | 8 |
| 🔥 Weekly Nurture | 10d | 7 |
| 🌱 Monthly Nurture | 33d | 3 |
| 👀 Quarterly Nurture | 93d | 1 |

### Leads Battr flagged in the last 3 days — do we agree?

Battr stamped **24** lead(s). We agree on **21** (14 at risk, 7 neglected); 1 not on our list, 2 compliant. For a lead we call worked, "our last touch" is the thing we count that Battr does not.

| FUB ID | Agent | Battr stamped | Our verdict | Our last touch | Window | Stage · timeframe id · source |
| ---: | --- | --- | --- | --- | ---: | --- |
| 70629 | Patty Cierley | 2026-10-19 | at risk | text out, 10.3d ago | 10d | Nurture · 1 · Zillow Preferred |
| 70985 | Anthony Ma | 2026-10-19 | at risk | call out, 16.2d ago | 16d | Nurture · 2 · Zillow Preferred |
| 98460 | Patty Cierley | 2026-10-19 | at risk | call out, 10.2d ago | 10d | Nurture · 1 · Zillow Preferred |
| 100570 | Patty Cierley | 2026-10-19 | at risk | call in, 17d ago | 16d | Spoke with Customer · 2 · zbuyer.com |
| 100952 | Patty Cierley | 2026-10-19 | at risk | call out, 16.3d ago | 16d | Spoke with Customer · 2 · Noah Cash Offer |
| 101196 | Misty Sumner | 2026-10-19 | at risk | text out, 11d ago | 10d | Attempted Contact · 1 · Zillow Preferred |
| 63970 | Anthony Ma | 2026-10-18 | at risk | call out, 11.3d ago | 10d | Lead · 1 · Zillow Preferred |
| 72761 | Kenny Chung | 2026-10-18 | at risk | call out, 12d ago | 10d | Attempted Contact · 4 · Zillow Preferred |
| 99298 | Quetza Adame | 2026-10-18 | at risk | call out, 11.1d ago | 10d | Nurture · 1 · Zillow Preferred |
| 99704 | Sylvia Landa | 2026-10-18 | at risk | call out, 17.2d ago | 16d | Spoke with Customer · 2 · TheRolandTeam.com |
| 100972 | Sylvia Landa | 2026-10-18 | at risk | call out, 11.3d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 101453 | Kenny Chung | 2026-10-18 | neglected | nothing in 100 days | 2d | Lead · none · Ylopo LSA |
| 69040 | Kenny Chung | 2026-10-17 | at risk | timeframe change, 12d ago | 10d | Attempted Contact · 3 · Zillow Preferred |
| 99295 | Ginger Pace | 2026-10-17 | at risk | call out, 35.3d ago | 33d | Nurture · 3 · Ylopo |
| 100243 | Kenny Chung | 2026-10-17 | at risk | call out, 12d ago | 10d | Attempted Contact · none · TheRolandTeam.com |
| 54770 | Anthony Ma | 2026-10-16 | neglected | call out, 13.4d ago | 10d | Attempted Contact · none · TheRolandTeam.com |
| 59054 | Kate Frihse | 2026-10-16 | neglected | nothing in 100 days | 10d | Attempted Contact · none · Google PPC |
| 63228 | Mike Roland | 2026-10-16 | not on our list | call out, 13.3d ago | —d | Spoke with Customer · 1 · Zillow Preferred |
| 74381 | Kate Frihse | 2026-10-16 | neglected | text out, 13.3d ago | 10d | Attempted Contact · none · zbuyer.com |
| 88213 | Karen Valdivia | 2026-10-16 | neglected | call out, 36.3d ago | 33d | Nurture · 3 · Zillow Preferred |
| 89962 | Quetza Adame | 2026-10-16 | neglected | text out, 19.1d ago | 16d | Spoke with Customer · 2 · Zillow |
| 99894 | Misty Sumner | 2026-10-16 | compliant | stage change, 10.7d ago | 93d | Nurture · 4 · Zillow Preferred |
| 100673 | Misty Sumner | 2026-10-16 | neglected | call out, 13.1d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 101379 | Kenny Chung | 2026-10-16 | compliant | timeframe change, 5.1d ago | 10d | Lead · 4 · zbuyer.com |

- Email-date rule check: **0 of 29** leads Battr flagged have a Follow Up Boss last-email date inside their window, as the rule assumes.

### Which Follow Up Boss date field is Battr's "last communication"?

Battr calls the 5 leads only we flag fine, so for most of them its field must be newer than the lead's window — and older for the 29 leads it flagged. A date field on the FUB record that does that is the candidate. Dates only.

| FUB date field | Inside window — only us | Inside window — Battr-flagged |
| --- | ---: | ---: |
| `lastSentInboxAppMessage` | 5 of 5 (100%) | 0 of 29 (0%) |
| `lastInboxAppMessage` | 5 of 5 (100%) | 0 of 29 (0%) |

### What sets the 5 leads only we flag apart from the 30 Battr stamped in the last 7 days

A pointer, not a proof — the groups are small. Something far commoner on our side is a candidate for what Battr treats as work, or as out of scope.

| More common among leads only we flag | Only us | Battr-flagged |
| --- | ---: | ---: |
| tag: RETURNED | 5 (100%) | 9 (30%) |
| tag: 89107 | 4 (80%) | 4 (13%) |
| tag: 89121 | 4 (80%) | 6 (20%) |
| has field: customTotalLogins | 5 (100%) | 13 (43%) |
| tag: Zillow Likely Mortgage Submitter | 3 (60%) | 4 (13%) |
| tag: 89183 | 3 (60%) | 4 (13%) |
| tag: 89147 | 3 (60%) | 4 (13%) |
| tag: 89123 | 3 (60%) | 5 (17%) |
| tag: 89103 | 3 (60%) | 5 (17%) |
| has field: lastSentInboxAppMessage | 5 (100%) | 18 (60%) |
| has field: lastSentInboxAppMessageId | 5 (100%) | 18 (60%) |
| has field: lastInboxAppMessage | 5 (100%) | 18 (60%) |

| More common among leads Battr flagged | Only us | Battr-flagged |
| --- | ---: | ---: |
| has field: customBattrAtRiskSince | 0 (0%) | 30 (100%) |
| has field: lastSentText | 2 (40%) | 27 (90%) |
| has field: lastSentTextId | 2 (40%) | 27 (90%) |
| has field: lastText | 2 (40%) | 27 (90%) |
| has field: lastTextId | 2 (40%) | 27 (90%) |
| has field: addresses | 0 (0%) | 15 (50%) |

### At risk here, not flagged by Battr — 5 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 101365 | Kate Frihse | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | stage change, 12.7d ago |
| 97709 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | timeframe change, 40.2d ago |
| 100523 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 31.3d ago |
| 100776 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow | call out, 30.2d ago |
| 100934 | Sylvia Landa | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | call out, 19.1d ago |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Quetza Adame | 32 | 19 | 1 | 0 |
| Shantele Marcum | 23 | 14 | 0 | 0 |
| Patty Cierley | 124 | 13 | 0 | 0 |
| Kenny Chung | 105 | 4 | 1 | 0 |
| Sylvia Landa | 23 | 3 | 2 | 0 |
| Anthony Ma | 37 | 3 | 1 | 0 |
| Kate Frihse | 7 | 1 | 3 | 0 |
| Misty Sumner | 15 | 1 | 2 | 0 |
| Nicole Miller | 10 | 3 | 0 | 0 |
| Karen Valdivia | 11 | 0 | 1 | 0 |
| Martine Goldberg | 7 | 1 | 0 | 0 |
| Liza Rivera | 3 | 1 | 0 | 0 |
| Ginger Pace | 3 | 1 | 0 | 0 |
| Eric Graham | 317 | 0 | 0 | 0 |
| Nik Sharapov | 60 | 0 | 0 | 0 |
| Lynda Hwang | 25 | 0 | 0 | 0 |
| Jason Shawver | 14 | 0 | 0 | 0 |
| Karen Lakes | 6 | 0 | 0 | 0 |
| Paul Arroyo | 4 | 0 | 0 | 0 |
| Adin Roland | 1 | 0 | 0 | 0 |
| Jamie Zahorobsky | 1 | 0 | 0 | 0 |

## Inbound, never answered (34)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Bernard Earl Fuller III | Patty Cierley | 91 | TheRolandTeam.com |
| Sabrina Ramirez | Lynda Hwang | 70 | Zillow Preferred |
| Rebecca Turner | Sylvia Landa | 56 | Realtor.com |
| Jasmine Lopez | Martine Goldberg | 53 | Google PPC |
| Sharon Swift | Kenny Chung | 45 | Google PPC |
| Ken Benson | Kenny Chung | 40 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 39 | TheRolandTeam.com |
| Pamela Cyrnek | Patty Cierley | 35 | TheRolandTeam.com |
| Henry Makekau | Misty Sumner | 25 | Jeffery Dragovich |
| Joseph Talamo | Patty Cierley | 24 | TheRolandTeam.com |
| Norma Holloway | Kenny Chung | 23 | Inbound Call |
| Renees Mendoza | Eric Graham | 19 | Google PPC |
| Laura Reeves | Jason Shawver | 18 | Zillow Preferred |
| Philip Rossovich | Patty Cierley | 18 | zbuyer.com |
| Lois Centeno | Kenny Chung | 18 | Ylopo |
| Jacqueline A Perez | Patty Cierley | 17 | zbuyer.com |
| Omar & Eylin Falbi | Anthony Ma | 16 | Jeffery Dragovich |
| Paul | Kate Frihse | 15 | Direct Traffic |
| Hasham Hanid | Sylvia Landa | 14 | Ylopo PPC+ |
| Edwin Morales | Patty Cierley | 13 | Zillow Preferred |
| Marlyn Peralta | Kenny Chung | 13 | zbuyer.com |
| Amanda Smith | Anthony Ma | 12 | Zillow Preferred |
| Dashawn Williams | Kenny Chung | 12 | Zillow Preferred |
| Terry | Nik Sharapov | 10 | Zillow Preferred |
| Angela Nickels | Misty Sumner | 10 | Zillow |
| Kiley Delapina Litogarcia | Kenny Chung | 8 | Zillow Preferred |
| Janai Walker | Patty Cierley | 6 | Zillow Preferred |
| Kelly Gafford | Eric Graham | 5 | Google PPC |
| Sammy Al Nobani | Kenny Chung | 5 | Zillow Preferred |
| Hugh McClimans | Liza Rivera | 5 | Citywide Long Form |
| Ryan Robison | Patty Cierley | 3 | Zillow Preferred |
| David Anthony Dion | Patty Cierley | 2 | Zillow Preferred |
| Kenneth Riley | Misty Sumner | 2 | Zillow Preferred |
| Adam Hernandaz | Kenny Chung | 2 | zbuyer.com |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| my +plus leads | Portals & aggregators | 43 | 0 |
| Zillow Preferred | Zillow | 13 | 4 |
| TheRolandTeam.com | Website & organic | 2 | 1 |
| zbuyer.com | Zillow | 1 | 2 |
| Steve Hawks | Team & internal | 2 | 0 |
| Zillow | Zillow | 1 | 1 |
| Google PPC | Paid search & social | 0 | 1 |
| ISA Transfer | Team & internal | 0 | 1 |
| Noah Cash Offer | Seller & valuation | 1 | 0 |
| Ylopo | Portals & aggregators | 1 | 0 |
| Ylopo LSA | Portals & aggregators | 0 | 1 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 115 | 44 | (+161.4%) | 2026-09-03 ⚠ 46d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 46d older |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2016 | 4198 | (-52.0%) | 2026-09-03 ⚠ 46d older |
| 🎤 AI TEXT REPLIES | 6 | 10 | (-40.0%) | 2026-09-03 ⚠ 46d older |
| ‼️ YLOPO IMPORTANT | 104 | 116 | (-10.3%) | 2026-09-03 ⚠ 46d older |
| ⭐️ Team Leads (combined) | 828 | 767 | (+8.0%) | 2026-10-07 ⚠ 12d older |
| 📖 Current & Upcoming Clients | 469 | 451 | (+4.0%) | 2026-09-03 ⚠ 46d older |
| 💛 Sphere & Past Clients | 3307 | 3332 | (-0.8%) | 2026-09-03 ⚠ 46d older |

> **8 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2016 | 4200 | 272 / 171 / 1573 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3307 | 3332 | 235 / 3 / 3069 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 104 | 116 | 55 / 15 / 34 | 64 / 8 / 44 |
| 🏹 Zillow Important | 115 | 44 | 23 / 5 / 87 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 469 | 451 | 129 / 33 / 307 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 6 | 10 | 5 / 0 / 1 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 39 | 0 | 2 | 5.1% | 53.8% |
| Quetza Adame | 23 | 0 | 1 | 4.3% | 87.0% |
| Mike Roland | 448 | 0 | 19 | 4.2% | 76.1% |
| Misty Sumner | 31 | 0 | 1 | 3.2% | 67.7% |
| Sylvia Landa | 46 | 0 | 1 | 2.2% | 78.3% |
| Nik Sharapov | 69 | 0 | 1 | 1.4% | 94.2% |
| Adin Roland | 2628 | 0 | 9 | 0.3% | 95.0% |
| Patty Cierley | 78 | 0 | 0 | 0.0% | 96.2% |
| Paul Arroyo | 51 | 0 | 0 | 0.0% | 33.3% |
| Kenny Chung | 49 | 0 | 0 | 0.0% | 61.2% |
| Eric Graham | 44 | 0 | 0 | 0.0% | 90.9% |
| Karen Valdivia | 24 | 0 | 0 | 0.0% | 87.5% |
| Anthony Ma | 23 | 0 | 0 | 0.0% | 95.7% |
| Shantele Marcum | 19 | 0 | 0 | 0.0% | 100.0% |
| User 73 | 12 | 0 | 0 | 0.0% | 0.0% |
| Jason Shawver | 9 | 0 | 0 | 0.0% | 66.7% |
| Martine Goldberg | 7 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Lynda Hwang | 4 | 0 | 0 | 0.0% | 100.0% |
| Nicole Miller | 1 | 0 | 0 | 0.0% | 100.0% |
| Liza Rivera | 1 | 0 | 0 | 0.0% | 100.0% |
| Karen Lakes | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-10-19-ubif`