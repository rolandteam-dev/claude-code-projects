> ## 🔬 SINGLE-LEAD LIVE TEST — lead #85008 only
>
> Nudged: Phumanee Nosavan (#85008, Liza Rivera, my +plus leads). Undo: `node scripts/battr-audit.mjs --undo=2026-10-08-wmio` Everything below is tonight's normal read-only audit; no other lead was touched and no agent was emailed.

# Battr audit — 2026-10-08

Run `2026-10-08-wmio` · **805 leads audited** of 54174 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **63** (1 new notes, 0 already flagged)
- Neglected: **3** (0 swept, 0 held back)
- Excluded: **10859** (10859 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **0** since the last run, **157** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **115** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Reactivated Ylopo leads (`Ylopo_Reactivated`) counted as worked on their last inbox message, to match Battr: **44** compliant lead(s) have it as their latest touch — none of them carry Battr's stamp, as expected
- Email counted as work: **105 manual**, 1173 automated (ignored), 0 undetermined — of 1278 row(s) read, 0 unusable
  - origin fields present on the sample: `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 63 → 63 and neglected 3 → 3
- Paused agents: **1** on `Battr Paused`, holding 3649 lead(s) back from nudges and sweeps
- **17 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **63** at risk against Battr's **14** (2026-10-07). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 55 | 87% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 20 | 32% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 42 | 67% |
| **None of the above** — Battr should be flagging these too | **1** | 2% |

**42 of 63** are expected differences — the two sources you chose to sweep. **21** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **157**, timeframe-change timestamps on **8794**, of 54174 FUB records (`timeframeUpdated` 8794, `stageUpdated` 157).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 6 | 6 (100%) | 0 |
| Only we flag them | 57 | 49 (86%) | 42 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quetza Adame | 23 | 20 | 3 | 18 | 0 |
| Shantele Marcum | 13 | 9 | 1 | 12 | 0 |
| Patty Cierley | 9 | 9 | 2 | 6 | 0 |
| Nik Sharapov | 5 | 5 | 4 | 1 | 0 |
| Nicole Miller | 4 | 4 | 4 | 3 | 0 |
| Kate Frihse | 2 | 1 | 0 | 0 | 1 |
| Karen Lakes | 2 | 2 | 2 | 0 | 0 |
| Misty Sumner | 2 | 2 | 2 | 0 | 0 |
| Liza Rivera | 1 | 1 | 0 | 1 | 0 |
| Bruce Schneider | 1 | 1 | 1 | 0 | 0 |
| Martine Goldberg | 1 | 1 | 1 | 1 | 0 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 39 |
| 🔥 Weekly Nurture | 10d | 8 |
| 😎 Bi-Weekly Nurture | 16d | 8 |
| 👀 Quarterly Nurture | 93d | 4 |
| 🌶️ Hot Leads | 2d | 3 |
| 🌱 Monthly Nurture | 33d | 1 |

### Leads Battr flagged in the last 3 days — do we agree?

Battr stamped **11** lead(s). We agree on **9** (6 at risk, 3 neglected); 2 not on our list. For a lead we call worked, "our last touch" is the thing we count that Battr does not.

| FUB ID | Agent | Battr stamped | Our verdict | Our last touch | Window | Stage · timeframe id · source |
| ---: | --- | --- | --- | --- | ---: | --- |
| 36791 | Misty Sumner | 2026-10-07 | at risk | text in, 94.8d ago | 93d | Nurture · 4 · Zillow |
| 98266 | Karen Lakes | 2026-10-07 | at risk | timeframe change, 93.9d ago | 93d | Nurture · 4 · Zillow Preferred |
| 101313 | Nik Sharapov | 2026-10-07 | at risk | email out, 3.8d ago | 2d | Attempted Contact · 1 · Zillow Preferred |
| 81931 | Karen Lakes | 2026-10-06 | at risk | call out, 12.2d ago | 10d | Nurture · 1 · Zillow Preferred |
| 100312 | Shantele Marcum | 2026-10-06 | at risk | call out, 24d ago | 10d | Spoke with Customer · 1 · Citywide Long Form |
| 101322 | Nik Sharapov | 2026-10-06 | neglected | email out, 4.8d ago | 2d | Attempted Contact · 1 · Zillow Preferred |
| 33546 | Adin Roland | 2026-10-05 | not on our list | stage change, 2.6d ago | —d | Attempted Contact · none · ISA Transfer |
| 63165 | Anthony Ma | 2026-10-05 | neglected | text out, 36.2d ago | 33d | Nurture · 3 · Zillow Preferred |
| 100388 | Liza Rivera | 2026-10-05 | neglected | call out, 13.1d ago | 10d | Attempted Contact · none · Citywide Long Form |
| 101216 | Quetza Adame | 2026-10-05 | at risk | text out, 13d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 101337 | Adin Roland | 2026-10-05 | not on our list | timeframe change, 6d ago | —d | Attempted Contact · 1 · Zillow Preferred |

- Email-date rule check: **0 of 10** leads Battr flagged have a Follow Up Boss last-email date inside their window, as the rule assumes.

### Which Follow Up Boss date field is Battr's "last communication"?

Battr calls the 15 leads only we flag fine, so for most of them its field must be newer than the lead's window — and older for the 10 leads it flagged. A date field on the FUB record that does that is the candidate. Dates only.

No date field separates the two groups: nothing on the record explains the difference, so what Battr counts is not stored there.

### What sets the 15 leads only we flag apart from the 10 Battr stamped in the last 7 days

A pointer, not a proof — the groups are small. Something far commoner on our side is a candidate for what Battr treats as work, or as out of scope.

| More common among leads only we flag | Only us | Battr-flagged |
| --- | ---: | ---: |
| timeframe id: 2 | 8 (53%) | 0 (0%) |
| list: 😎 Bi-Weekly Nurture | 7 (47%) | 0 (0%) |
| has field: customTotalLogins | 9 (60%) | 2 (20%) |
| tag: RETURNED | 8 (53%) | 2 (20%) |
| has field: customAvePricePoint | 8 (53%) | 2 (20%) |
| has field: customTotalListingsViewed | 8 (53%) | 2 (20%) |
| tag: speculo_conversation | 5 (33%) | 0 (0%) |
| tag: 89014 | 6 (40%) | 1 (10%) |
| has field: customSpeculoOutcomeDate | 7 (47%) | 2 (20%) |
| has field: customSpeculoRecentOutcome | 7 (47%) | 2 (20%) |

| More common among leads Battr flagged | Only us | Battr-flagged |
| --- | ---: | ---: |
| has field: customBattrAtRiskSince | 0 (0%) | 10 (100%) |
| tag: speculo_convert_buyer | 3 (20%) | 6 (60%) |
| has field: customBattrLastNeglectedBy | 2 (13%) | 5 (50%) |
| has field: customBattrLastNeglectedOn | 2 (13%) | 5 (50%) |
| tag: 89052 | 1 (7%) | 4 (40%) |
| tag: Summary Box Icons | 10 (67%) | 10 (100%) |

### At risk here, not flagged by Battr — 15 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 56502 | Bruce Schneider | 😎 Bi-Weekly Nurture | 16d | Nurture | Company Websites | call in, 16.1d ago |
| 85089 | Kate Frihse | 🌤️ Warm Back Up | 10d | Attempted Contact | Zillow Preferred | text out, 10.1d ago |
| 101362 | Kate Frihse | 🌶️ Hot Leads | 2d | Lead | Noah Cash Offer | nothing in 100 days |
| 101266 | Misty Sumner | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | timeframe change, 10.2d ago |
| 86626 | Nicole Miller | 👀 Quarterly Nurture | 93d | Nurture | HomeLight | call in, 93.1d ago |
| 96046 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Nurture | Zillow | email out, 10.8d ago |
| 99523 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | Citywide Long Form | email out, 10.3d ago |
| 101360 | Nik Sharapov | 🌶️ Hot Leads | 2d | Attempted Contact | Zillow Preferred | email out, 2.2d ago |
| 70629 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text out, 21.1d ago |
| 100523 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 20.1d ago |
| 100776 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow | call out, 19.1d ago |
| 70783 | Quetza Adame | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 16d ago |
| 100654 | Quetza Adame | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 16.1d ago |
| 100921 | Quetza Adame | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | YouTube | call out, 16.1d ago |
| 100945 | Quetza Adame | 😎 Bi-Weekly Nurture | 16d | Nurture | zbuyer.com | call out, 16.1d ago |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Quetza Adame | 33 | 23 | 0 | 0 |
| Shantele Marcum | 21 | 13 | 0 | 0 |
| Patty Cierley | 112 | 9 | 0 | 0 |
| Nik Sharapov | 58 | 5 | 1 | 0 |
| Nicole Miller | 11 | 4 | 0 | 0 |
| Misty Sumner | 14 | 2 | 0 | 0 |
| Kate Frihse | 9 | 2 | 0 | 0 |
| Karen Lakes | 6 | 2 | 0 | 0 |
| Liza Rivera | 4 | 1 | 1 | 0 |
| Anthony Ma | 31 | 0 | 1 | 0 |
| Bruce Schneider | 8 | 1 | 0 | 0 |
| Martine Goldberg | 6 | 1 | 0 | 0 |
| Eric Graham | 316 | 0 | 0 | 0 |
| Kenny Chung | 97 | 0 | 0 | 0 |
| Lynda Hwang | 25 | 0 | 0 | 0 |
| Sylvia Landa | 24 | 0 | 0 | 0 |
| Karen Valdivia | 11 | 0 | 0 | 0 |
| Jason Shawver | 10 | 0 | 0 | 0 |
| Paul Arroyo | 4 | 0 | 0 | 0 |
| Ginger Pace | 3 | 0 | 0 | 0 |
| Adin Roland | 1 | 0 | 0 | 0 |
| Jamie Zahorobsky | 1 | 0 | 0 | 0 |

## Inbound, never answered (29)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Teddy Levi | Karen Lakes | 98 | Zillow Preferred |
| Angela Nickels | Misty Sumner | 94 | Zillow |
| Andrew Keter | Nicole Miller | 93 | HomeLight |
| Teal McMillan | Patty Cierley | 91 | Redfin |
| Rico | Eric Graham | 82 | Zillow Preferred |
| Sabrina Ramirez | Lynda Hwang | 59 | Zillow Preferred |
| Rebecca Turner | Sylvia Landa | 45 | Realtor.com |
| Jasmine Lopez | Martine Goldberg | 41 | Google PPC |
| Wendy Hottel | Bruce Schneider | 35 | Bing PPC |
| Sharon Swift | Kenny Chung | 34 | Google PPC |
| Ken Benson | Kenny Chung | 29 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 27 | TheRolandTeam.com |
| Pamela Cyrnek | Patty Cierley | 24 | TheRolandTeam.com |
| Mike Fisher | Bruce Schneider | 16 | Company Websites |
| Henry Makekau | Misty Sumner | 14 | Jeffery Dragovich |
| Joseph Talamo | Patty Cierley | 13 | TheRolandTeam.com |
| Norma Holloway | Kenny Chung | 11 | Inbound Call |
| Renees Mendoza | Eric Graham | 8 | Google PPC |
| Mihailo Jovanovic | Sylvia Landa | 7 | TheRolandTeam.com |
| Gabby Chumbe-Sandoval | Nik Sharapov | 7 | Google Lsa |
| Laura Reeves | Jason Shawver | 7 | Zillow Preferred |
| Philip Rossovich | Patty Cierley | 6 | zbuyer.com |
| Jacqueline A Perez | Patty Cierley | 5 | zbuyer.com |
| James Korch | Sylvia Landa | 4 | zbuyer.com |
| Paul | Kate Frihse | 4 | Direct Traffic |
| Omar & Eylin Falbi | Anthony Ma | 4 | Jeffery Dragovich |
| Ryan Robison | Patty Cierley | 3 | Zillow Preferred |
| Hasham Hanid | Sylvia Landa | 3 | Ylopo PPC+ |
| Pam Hunter | Kate Frihse | 2 | Zillow Preferred |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| my +plus leads | Portals & aggregators | 40 | 0 |
| Zillow Preferred | Zillow | 11 | 2 |
| Citywide Long Form | Portals & aggregators | 2 | 1 |
| Zillow | Zillow | 3 | 0 |
| Steve Hawks | Team & internal | 2 | 0 |
| Company Websites | Website & organic | 1 | 0 |
| YouTube | Paid search & social | 1 | 0 |
| zbuyer.com | Zillow | 1 | 0 |
| HomeLight | Portals & aggregators | 1 | 0 |
| Noah Cash Offer | Seller & valuation | 1 | 0 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 146 | 44 | (+231.8%) | 2026-09-03 ⚠ 34d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 34d older |
| 🎤 AI TEXT REPLIES | 11 | 10 | (+10.0%) | 2026-09-03 ⚠ 34d older |
| 📖 Current & Upcoming Clients | 485 | 451 | (+7.5%) | 2026-09-03 ⚠ 34d older |
| ‼️ YLOPO IMPORTANT | 109 | 116 | (-6.0%) | 2026-09-03 ⚠ 34d older |
| ⭐️ Team Leads (combined) | 806 | 767 | +5.1% | 2026-10-07 |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4107 | 4198 | (-2.2%) | 2026-09-03 ⚠ 34d older |
| 💛 Sphere & Past Clients | 3342 | 3332 | (+0.3%) | 2026-09-03 ⚠ 34d older |

> **7 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4107 | 4200 | 426 / 115 / 3566 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3342 | 3332 | 225 / 6 / 3111 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 108 | 116 | 60 / 11 / 37 | 64 / 8 / 44 |
| 🏹 Zillow Important | 145 | 44 | 23 / 8 / 114 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 486 | 451 | 148 / 17 / 321 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 11 | 10 | 9 / 0 / 2 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 33 | 0 | 2 | 6.1% | 63.6% |
| Quetza Adame | 19 | 0 | 1 | 5.3% | 94.7% |
| Mike Roland | 391 | 0 | 18 | 4.6% | 77.7% |
| Nik Sharapov | 56 | 0 | 1 | 1.8% | 94.6% |
| Adin Roland | 1660 | 0 | 5 | 0.3% | 95.0% |
| Patty Cierley | 54 | 0 | 0 | 0.0% | 96.3% |
| Kenny Chung | 42 | 0 | 0 | 0.0% | 59.5% |
| Sylvia Landa | 36 | 0 | 0 | 0.0% | 83.3% |
| Eric Graham | 29 | 0 | 0 | 0.0% | 93.1% |
| Misty Sumner | 28 | 0 | 0 | 0.0% | 82.1% |
| Paul Arroyo | 27 | 0 | 0 | 0.0% | 100.0% |
| Karen Valdivia | 24 | 0 | 0 | 0.0% | 87.5% |
| Anthony Ma | 18 | 0 | 0 | 0.0% | 94.4% |
| Bruce Schneider | 12 | 0 | 0 | 0.0% | 66.7% |
| Shantele Marcum | 11 | 0 | 0 | 0.0% | 100.0% |
| Jason Shawver | 8 | 0 | 0 | 0.0% | 62.5% |
| Martine Goldberg | 6 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Lynda Hwang | 4 | 0 | 0 | 0.0% | 100.0% |
| Nicole Miller | 1 | 0 | 0 | 0.0% | 100.0% |
| Liza Rivera | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-10-08-wmio`