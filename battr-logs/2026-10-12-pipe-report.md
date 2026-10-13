# Battr audit — 2026-10-12 (DRY RUN — nothing was written)

Run `2026-10-12-pipe` · **817 leads audited** of 51273 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **58** (0 new notes, 0 already flagged)
- Neglected: **7** (0 swept, 0 held back)
- Excluded: **10127** (10127 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **27** since the last run, **234** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **127** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Reactivated Ylopo leads (`Ylopo_Reactivated`) counted as worked on their last inbox message, to match Battr: **39** compliant lead(s) have it as their latest touch — none of them carry Battr's stamp, as expected
- Email counted as work: **30 manual**, 757 automated (ignored), 0 undetermined — of 787 row(s) read, 0 unusable
  - origin fields present on the sample: `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 58 → 58 and neglected 7 → 7
- Paused agents: **1** on `Battr Paused`, holding 3641 lead(s) back from nudges and sweeps
- **58 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **7 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **17 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **58** at risk against Battr's **14** (2026-10-07). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 14 | 24% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 23 | 40% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 41 | 71% |
| **None of the above** — Battr should be flagging these too | **1** | 2% |

**41 of 58** are expected differences — the two sources you chose to sweep. **17** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **234**, timeframe-change timestamps on **8416**, of 51273 FUB records (`timeframeUpdated` 8416, `stageUpdated` 234).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 14 | 8 (57%) | 0 |
| Only we flag them | 44 | 6 (14%) | 41 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quetza Adame | 18 | 0 | 2 | 18 | 0 |
| Patty Cierley | 15 | 9 | 9 | 6 | 0 |
| Shantele Marcum | 12 | 0 | 0 | 12 | 0 |
| Sylvia Landa | 4 | 1 | 3 | 0 | 1 |
| Nicole Miller | 3 | 2 | 3 | 3 | 0 |
| Anthony Ma | 2 | 1 | 2 | 0 | 0 |
| Liza Rivera | 1 | 0 | 1 | 1 | 0 |
| Paul Arroyo | 1 | 0 | 1 | 0 | 0 |
| Kate Frihse | 1 | 0 | 1 | 0 | 0 |
| Martine Goldberg | 1 | 1 | 1 | 1 | 0 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 40 |
| 🔥 Weekly Nurture | 10d | 6 |
| 😎 Bi-Weekly Nurture | 16d | 5 |
| 🌱 Monthly Nurture | 33d | 4 |
| 👀 Quarterly Nurture | 93d | 2 |
| 🌶️ Hot Leads | 2d | 1 |

### Leads Battr flagged in the last 3 days — do we agree?

Battr stamped **18** lead(s). We agree on **14** (13 at risk, 1 neglected); 4 compliant. For a lead we call worked, "our last touch" is the thing we count that Battr does not.

| FUB ID | Agent | Battr stamped | Our verdict | Our last touch | Window | Stage · timeframe id · source |
| ---: | --- | --- | --- | --- | ---: | --- |
| 37305 | Patty Cierley | 2026-10-12 | at risk | text out, 16.2d ago | 16d | Nurture · 2 · TheRolandTeam.com |
| 60266 | Sylvia Landa | 2026-10-12 | at risk | call out, 10.1d ago | 10d | Nurture · 1 · ReferralExchange |
| 73146 | Patty Cierley | 2026-10-12 | at risk | call out, 33.2d ago | 33d | Nurture · 3 · Zillow Preferred |
| 99964 | Patty Cierley | 2026-10-12 | at risk | timeframe change, 93.2d ago | 93d | Spoke with Customer · 4 · zbuyer.com |
| 100870 | Patty Cierley | 2026-10-12 | at risk | call out, 10.2d ago | 10d | Attempted Contact · none · zbuyer.com |
| 79986 | Patty Cierley | 2026-10-11 | at risk | text out, 35d ago | 33d | Nurture · 3 · zbuyer.com |
| 100716 | Paul Arroyo | 2026-10-11 | at risk | call out, 11.1d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 101129 | Patty Cierley | 2026-10-11 | at risk | text in, 17.3d ago | 16d | Spoke with Customer · 2 · Noah Cash Offer |
| 101319 | Kate Frihse | 2026-10-11 | at risk | timeframe change, 11.2d ago | 10d | Spoke with Customer · 1 · Noah Cash Offer |
| 101364 | Anthony Ma | 2026-10-11 | at risk | call out, 3.4d ago | 2d | Attempted Contact · 2 · Zillow Preferred |
| 99288 | Sylvia Landa | 2026-10-10 | at risk | text out, 12d ago | 10d | Nurture · 1 · TheRolandTeam.com |
| 100559 | Anthony Ma | 2026-10-10 | at risk | text out, 12.3d ago | 10d | Lead · 2 · Ylopo PPC+ |
| 100934 | Sylvia Landa | 2026-10-10 | at risk | call out, 12.1d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 99736 | Misty Sumner | 2026-10-09 | compliant | stage change, 3.7d ago | 10d | Nurture · 1 · Zillow Preferred |
| 100441 | Anthony Ma | 2026-10-09 | neglected | call out, 20.4d ago | 16d | Spoke with Customer · 2 · Citywide Long Form |
| 100633 | Misty Sumner | 2026-10-09 | compliant | stage change, 3.7d ago | 10d | Nurture · 1 · Zillow Preferred |
| 100824 | Misty Sumner | 2026-10-09 | compliant | stage change, 3.7d ago | 10d | Nurture · 1 · Zillow Preferred |
| 100889 | Misty Sumner | 2026-10-09 | compliant | stage change, 3.7d ago | 10d | Nurture · 1 · Zillow Preferred |

- Email-date rule check: **0 of 24** leads Battr flagged have a Follow Up Boss last-email date inside their window, as the rule assumes.

### Which Follow Up Boss date field is Battr's "last communication"?

Battr calls the 3 leads only we flag fine, so for most of them its field must be newer than the lead's window — and older for the 24 leads it flagged. A date field on the FUB record that does that is the candidate. Dates only.

No date field separates the two groups: nothing on the record explains the difference, so what Battr counts is not stored there.

### What sets the 3 leads only we flag apart from the 24 Battr stamped in the last 7 days

A pointer, not a proof — the groups are small. Something far commoner on our side is a candidate for what Battr treats as work, or as out of scope.

| More common among leads only we flag | Only us | Battr-flagged |
| --- | ---: | ---: |
| tag: RETURNED | 3 (100%) | 8 (33%) |
| has field: lastSentEmail | 3 (100%) | 8 (33%) |
| has field: lastSentEmailId | 3 (100%) | 8 (33%) |
| has field: customTotalLogins | 3 (100%) | 8 (33%) |
| tag: NOTEXT | 3 (100%) | 9 (38%) |
| tag: kts nurture buyer texting betty | 3 (100%) | 10 (42%) |
| has field: sourceUrl | 3 (100%) | 11 (46%) |
| has field: socialData | 3 (100%) | 11 (46%) |
| has field: lastEmEventActivity | 3 (100%) | 11 (46%) |
| has field: lastEmEventActivityId | 3 (100%) | 11 (46%) |
| stage: Nurture | 3 (100%) | 12 (50%) |
| tag: 89122 | 2 (67%) | 4 (17%) |

| More common among leads Battr flagged | Only us | Battr-flagged |
| --- | ---: | ---: |
| has field: customBattrAtRiskSince | 0 (0%) | 24 (100%) |
| has field: lastIncomingCall | 0 (0%) | 15 (63%) |
| has field: lastIncomingCallId | 0 (0%) | 15 (63%) |
| has field: addresses | 0 (0%) | 14 (58%) |
| has field: lastSentText | 1 (33%) | 19 (79%) |
| has field: lastSentTextId | 1 (33%) | 19 (79%) |

### At risk here, not flagged by Battr — 3 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 97709 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | timeframe change, 33.2d ago |
| 100523 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 24.3d ago |
| 100776 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow | call out, 23.2d ago |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Quetza Adame | 33 | 18 | 2 | 0 |
| Patty Cierley | 116 | 15 | 0 | 0 |
| Shantele Marcum | 21 | 12 | 0 | 0 |
| Sylvia Landa | 25 | 4 | 0 | 0 |
| Nicole Miller | 11 | 3 | 1 | 0 |
| Anthony Ma | 33 | 2 | 1 | 0 |
| Kate Frihse | 11 | 1 | 2 | 0 |
| Paul Arroyo | 12 | 1 | 0 | 0 |
| Karen Lakes | 6 | 0 | 1 | 0 |
| Martine Goldberg | 6 | 1 | 0 | 0 |
| Liza Rivera | 3 | 1 | 0 | 0 |
| Eric Graham | 312 | 0 | 0 | 0 |
| Kenny Chung | 98 | 0 | 0 | 0 |
| Nik Sharapov | 57 | 0 | 0 | 0 |
| Lynda Hwang | 25 | 0 | 0 | 0 |
| Misty Sumner | 22 | 0 | 0 | 0 |
| Karen Valdivia | 11 | 0 | 0 | 0 |
| Jason Shawver | 10 | 0 | 0 | 0 |
| Ginger Pace | 3 | 0 | 0 | 0 |
| Adin Roland | 1 | 0 | 0 | 0 |
| Jamie Zahorobsky | 1 | 0 | 0 | 0 |

## Inbound, never answered (33)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Andrew Keter | Nicole Miller | 97 | HomeLight |
| Teal McMillan | Patty Cierley | 95 | Redfin |
| Rico | Eric Graham | 86 | Zillow Preferred |
| Sabrina Ramirez | Lynda Hwang | 63 | Zillow Preferred |
| Rebecca Turner | Sylvia Landa | 49 | Realtor.com |
| Jasmine Lopez | Martine Goldberg | 46 | Google PPC |
| Sharon Swift | Kenny Chung | 38 | Google PPC |
| Ken Benson | Kenny Chung | 33 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 32 | TheRolandTeam.com |
| Joey Burke | Misty Sumner | 29 | Zillow Preferred |
| Pamela Cyrnek | Patty Cierley | 28 | TheRolandTeam.com |
| Henry Makekau | Misty Sumner | 18 | Jeffery Dragovich |
| Melanie Isbell | Patty Cierley | 17 | Noah Cash Offer |
| Joseph Talamo | Patty Cierley | 17 | TheRolandTeam.com |
| Norma Holloway | Kenny Chung | 16 | Inbound Call |
| Renees Mendoza | Eric Graham | 12 | Google PPC |
| Gabby Chumbe-Sandoval | Nik Sharapov | 11 | Google Lsa |
| Laura Reeves | Jason Shawver | 11 | Zillow Preferred |
| Philip Rossovich | Patty Cierley | 11 | zbuyer.com |
| Lois Centeno | Kenny Chung | 11 | Ylopo |
| Jacqueline A Perez | Patty Cierley | 10 | zbuyer.com |
| James Korch | Sylvia Landa | 9 | zbuyer.com |
| Omar & Eylin Falbi | Anthony Ma | 9 | Jeffery Dragovich |
| Paul | Kate Frihse | 8 | Direct Traffic |
| Ryan Robison | Patty Cierley | 7 | Zillow Preferred |
| Hasham Hanid | Sylvia Landa | 7 | Ylopo PPC+ |
| Pam Hunter | Kate Frihse | 6 | Zillow Preferred |
| Marlyn Peralta | Kenny Chung | 6 | zbuyer.com |
| Zachary C Burkes | Patty Cierley | 5 | ISA Transfer |
| Amanda Smith | Anthony Ma | 5 | Zillow Preferred |
| Dashawn Williams | Kenny Chung | 5 | Zillow Preferred |
| Terry | Nik Sharapov | 3 | Zillow Preferred |
| Angela Nickels | Misty Sumner | 3 | Zillow |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| my +plus leads | Portals & aggregators | 39 | 0 |
| Zillow Preferred | Zillow | 6 | 2 |
| zbuyer.com | Zillow | 3 | 1 |
| TheRolandTeam.com | Website & organic | 3 | 0 |
| Noah Cash Offer | Seller & valuation | 2 | 1 |
| Steve Hawks | Team & internal | 2 | 0 |
| Ylopo PPC+ | Portals & aggregators | 1 | 0 |
| ReferralExchange | Portals & aggregators | 1 | 0 |
| Citywide Long Form | Portals & aggregators | 0 | 1 |
| Zillow | Zillow | 1 | 0 |
| YouTube | Paid search & social | 0 | 1 |
| HomeLight | Portals & aggregators | 0 | 1 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 145 | 44 | (+229.5%) | 2026-09-03 ⚠ 39d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 39d older |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2006 | 4198 | (-52.2%) | 2026-09-03 ⚠ 39d older |
| 🎤 AI TEXT REPLIES | 6 | 10 | (-40.0%) | 2026-09-03 ⚠ 39d older |
| ‼️ YLOPO IMPORTANT | 100 | 116 | (-13.8%) | 2026-09-03 ⚠ 39d older |
| ⭐️ Team Leads (combined) | 817 | 767 | (+6.5%) | 2026-10-07 ⚠ 5d older |
| 📖 Current & Upcoming Clients | 473 | 451 | (+4.9%) | 2026-09-03 ⚠ 39d older |
| 💛 Sphere & Past Clients | 3306 | 3332 | (-0.8%) | 2026-09-03 ⚠ 39d older |

> **8 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2006 | 4200 | 314 / 121 / 1571 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3306 | 3332 | 243 / 18 / 3045 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 100 | 116 | 57 / 11 / 32 | 64 / 8 / 44 |
| 🏹 Zillow Important | 145 | 44 | 21 / 12 / 112 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 473 | 451 | 153 / 13 / 307 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 6 | 10 | 5 / 0 / 1 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 36 | 0 | 2 | 5.6% | 66.7% |
| Mike Roland | 407 | 0 | 19 | 4.7% | 73.7% |
| Quetza Adame | 23 | 0 | 1 | 4.3% | 95.7% |
| Misty Sumner | 30 | 0 | 1 | 3.3% | 70.0% |
| Nik Sharapov | 58 | 0 | 1 | 1.7% | 93.1% |
| Adin Roland | 2311 | 0 | 8 | 0.3% | 95.8% |
| Patty Cierley | 61 | 0 | 0 | 0.0% | 96.7% |
| Paul Arroyo | 48 | 0 | 0 | 0.0% | 100.0% |
| Kenny Chung | 45 | 0 | 0 | 0.0% | 57.8% |
| Sylvia Landa | 39 | 0 | 0 | 0.0% | 84.6% |
| Eric Graham | 32 | 0 | 0 | 0.0% | 90.6% |
| Karen Valdivia | 24 | 0 | 0 | 0.0% | 87.5% |
| Anthony Ma | 21 | 0 | 0 | 0.0% | 95.2% |
| Shantele Marcum | 13 | 0 | 0 | 0.0% | 100.0% |
| User 73 | 12 | 0 | 0 | 0.0% | 0.0% |
| Jason Shawver | 8 | 0 | 0 | 0.0% | 62.5% |
| Martine Goldberg | 6 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Lynda Hwang | 4 | 0 | 0 | 0.0% | 100.0% |
| Nicole Miller | 1 | 0 | 0 | 0.0% | 100.0% |
| Liza Rivera | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-10-12-pipe`