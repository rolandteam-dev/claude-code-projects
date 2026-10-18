# Battr audit — 2026-10-17 (DRY RUN — nothing was written)

Run `2026-10-17-svtv` · **821 leads audited** of 51307 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **62** (0 new notes, 0 already flagged)
- Neglected: **2** (0 swept, 0 held back)
- Excluded: **10130** (10130 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **6** since the last run, **355** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **127** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Reactivated Ylopo leads (`Ylopo_Reactivated`) counted as worked on their last inbox message, to match Battr: **31** compliant lead(s) have it as their latest touch — none of them carry Battr's stamp, as expected
- Email counted as work: **83 manual**, 861 automated (ignored), 0 undetermined — of 944 row(s) read, 0 unusable
  - origin fields present on the sample: `actionPlanId`, `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 62 → 62 and neglected 2 → 2
- Paused agents: **1** on `Battr Paused`, holding 3640 lead(s) back from nudges and sweeps
- **62 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **2 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **18 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **62** at risk against Battr's **14** (2026-10-07). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 33 | 53% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 25 | 40% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 43 | 69% |
| **None of the above** — Battr should be flagging these too | **0** | 0% |

**43 of 62** are expected differences — the two sources you chose to sweep. **19** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **355**, timeframe-change timestamps on **8457**, of 51307 FUB records (`timeframeUpdated` 8457, `stageUpdated` 355).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 13 | 8 (62%) | 0 |
| Only we flag them | 49 | 25 (51%) | 43 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quetza Adame | 19 | 10 | 2 | 18 | 0 |
| Shantele Marcum | 14 | 8 | 0 | 14 | 0 |
| Patty Cierley | 10 | 4 | 4 | 6 | 0 |
| Kate Frihse | 3 | 2 | 3 | 0 | 0 |
| Kenny Chung | 3 | 1 | 3 | 0 | 0 |
| Nicole Miller | 3 | 2 | 3 | 3 | 0 |
| Misty Sumner | 2 | 1 | 2 | 0 | 0 |
| Sylvia Landa | 2 | 0 | 2 | 0 | 0 |
| Anthony Ma | 1 | 1 | 1 | 0 | 0 |
| Liza Rivera | 1 | 0 | 1 | 1 | 0 |
| Paul Arroyo | 1 | 1 | 1 | 0 | 0 |
| Martine Goldberg | 1 | 1 | 1 | 1 | 0 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 45 |
| 🔥 Weekly Nurture | 10d | 6 |
| 🌱 Monthly Nurture | 33d | 5 |
| 😎 Bi-Weekly Nurture | 16d | 4 |
| 👀 Quarterly Nurture | 93d | 1 |
| 🌶️ Hot Leads | 2d | 1 |

### Leads Battr flagged in the last 3 days — do we agree?

Battr stamped **20** lead(s). We agree on **15** (13 at risk, 2 neglected); 5 compliant. For a lead we call worked, "our last touch" is the thing we count that Battr does not.

| FUB ID | Agent | Battr stamped | Our verdict | Our last touch | Window | Stage · timeframe id · source |
| ---: | --- | --- | --- | --- | ---: | --- |
| 69040 | Kenny Chung | 2026-10-17 | at risk | timeframe change, 10d ago | 10d | Attempted Contact · 3 · Zillow Preferred |
| 99295 | Ginger Pace | 2026-10-17 | at risk | call out, 33.3d ago | 33d | Nurture · 3 · Ylopo |
| 99884 | Patty Cierley | 2026-10-17 | at risk | call in, 33.2d ago | 33d | Nurture · 3 · TheRolandTeam.com |
| 100243 | Kenny Chung | 2026-10-17 | at risk | call out, 10d ago | 10d | Attempted Contact · none · TheRolandTeam.com |
| 54770 | Anthony Ma | 2026-10-16 | at risk | call out, 11.4d ago | 10d | Attempted Contact · none · TheRolandTeam.com |
| 59054 | Kate Frihse | 2026-10-16 | at risk | nothing in 100 days | 10d | Attempted Contact · none · Google PPC |
| 63228 | Paul Arroyo | 2026-10-16 | at risk | call out, 11.3d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 74381 | Kate Frihse | 2026-10-16 | at risk | text out, 11.3d ago | 10d | Attempted Contact · none · zbuyer.com |
| 88213 | Karen Valdivia | 2026-10-16 | at risk | call out, 34.3d ago | 33d | Nurture · 3 · Zillow Preferred |
| 89962 | Quetza Adame | 2026-10-16 | at risk | text out, 17.1d ago | 16d | Spoke with Customer · 2 · Zillow |
| 99894 | Misty Sumner | 2026-10-16 | compliant | stage change, 8.7d ago | 93d | Nurture · 4 · Zillow Preferred |
| 100516 | Jason Shawver | 2026-10-16 | compliant | stage change, 0.8d ago | 16d | Nurture · 2 · Zillow Preferred |
| 100673 | Misty Sumner | 2026-10-16 | at risk | call out, 11.1d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 101379 | Kenny Chung | 2026-10-16 | compliant | timeframe change, 3.1d ago | 10d | Lead · 4 · zbuyer.com |
| 100253 | Misty Sumner | 2026-10-15 | at risk | stage change, 11.7d ago | 10d | Attempted Contact · 2 · ISA Transfer |
| 101364 | Anthony Ma | 2026-10-15 | compliant | call out, 4.1d ago | 10d | Attempted Contact · 2 · Zillow Preferred |
| 74665 | Kate Frihse | 2026-10-14 | neglected | text out, 13.3d ago | 10d | Nurture · 1 · Zillow Preferred |
| 101051 | Sylvia Landa | 2026-10-14 | at risk | stage change, 12.7d ago | 10d | Nurture · 1 · Zillow Preferred |
| 101193 | Misty Sumner | 2026-10-14 | compliant | stage change, 8.7d ago | 16d | Nurture · 2 · Zillow Preferred |
| 101273 | Sylvia Landa | 2026-10-14 | neglected | text out, 14d ago | 10d | Spoke with Customer · 1 · zbuyer.com |

- Email-date rule check: **0 of 20** leads Battr flagged have a Follow Up Boss last-email date inside their window, as the rule assumes.

### Which Follow Up Boss date field is Battr's "last communication"?

Battr calls the 6 leads only we flag fine, so for most of them its field must be newer than the lead's window — and older for the 20 leads it flagged. A date field on the FUB record that does that is the candidate. Dates only.

| FUB date field | Inside window — only us | Inside window — Battr-flagged |
| --- | ---: | ---: |
| `lastSentInboxAppMessage` | 5 of 6 (83%) | 0 of 20 (0%) |
| `lastInboxAppMessage` | 5 of 6 (83%) | 0 of 20 (0%) |
| `lastLeadActivity` | 4 of 6 (67%) | 5 of 20 (25%) |

### What sets the 6 leads only we flag apart from the 20 Battr stamped in the last 7 days

A pointer, not a proof — the groups are small. Something far commoner on our side is a candidate for what Battr treats as work, or as out of scope.

| More common among leads only we flag | Only us | Battr-flagged |
| --- | ---: | ---: |
| tag: 89121 | 4 (67%) | 1 (5%) |
| tag: 89107 | 4 (67%) | 2 (10%) |
| tag: RETURNED | 5 (83%) | 7 (35%) |
| has field: sourceUrl | 6 (100%) | 12 (60%) |
| has field: customTotalLogins | 5 (83%) | 10 (50%) |
| tag: Summary Box Icons | 6 (100%) | 14 (70%) |
| tag: speculo_revive_flywheel | 4 (67%) | 8 (40%) |
| tag: Buyer Consultation Series | 6 (100%) | 15 (75%) |
| tag: speculo_convert_buyer | 3 (50%) | 5 (25%) |
| tag: Henderson | 3 (50%) | 5 (25%) |
| lead age: 30-90d | 3 (50%) | 5 (25%) |

| More common among leads Battr flagged | Only us | Battr-flagged |
| --- | ---: | ---: |
| has field: customBattrAtRiskSince | 0 (0%) | 20 (100%) |
| has field: lastSentText | 2 (33%) | 18 (90%) |
| has field: lastSentTextId | 2 (33%) | 18 (90%) |
| has field: lastText | 2 (33%) | 18 (90%) |
| has field: lastTextId | 2 (33%) | 18 (90%) |
| list: 🌤️ Warm Back Up | 0 (0%) | 8 (40%) |

### At risk here, not flagged by Battr — 6 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 101365 | Kate Frihse | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | stage change, 10.7d ago |
| 101453 | Kenny Chung | 🌶️ Hot Leads | 2d | Lead | Ylopo LSA | nothing in 100 days |
| 97709 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | timeframe change, 38.2d ago |
| 100523 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 29.3d ago |
| 100776 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow | call out, 28.2d ago |
| 100934 | Sylvia Landa | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | call out, 17.1d ago |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Quetza Adame | 32 | 19 | 0 | 0 |
| Shantele Marcum | 21 | 14 | 0 | 0 |
| Patty Cierley | 121 | 10 | 0 | 0 |
| Kate Frihse | 8 | 3 | 1 | 0 |
| Kenny Chung | 103 | 3 | 0 | 0 |
| Sylvia Landa | 22 | 2 | 1 | 0 |
| Nicole Miller | 10 | 3 | 0 | 0 |
| Misty Sumner | 15 | 2 | 0 | 0 |
| Anthony Ma | 35 | 1 | 0 | 0 |
| Paul Arroyo | 12 | 1 | 0 | 0 |
| Karen Valdivia | 11 | 1 | 0 | 0 |
| Martine Goldberg | 7 | 1 | 0 | 0 |
| Liza Rivera | 3 | 1 | 0 | 0 |
| Ginger Pace | 3 | 1 | 0 | 0 |
| Eric Graham | 315 | 0 | 0 | 0 |
| Nik Sharapov | 59 | 0 | 0 | 0 |
| Lynda Hwang | 25 | 0 | 0 | 0 |
| Jason Shawver | 12 | 0 | 0 | 0 |
| Karen Lakes | 5 | 0 | 0 | 0 |
| Adin Roland | 1 | 0 | 0 | 0 |
| Jamie Zahorobsky | 1 | 0 | 0 | 0 |

## Inbound, never answered (31)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Bernard Earl Fuller III | Patty Cierley | 89 | TheRolandTeam.com |
| Sabrina Ramirez | Lynda Hwang | 68 | Zillow Preferred |
| Rebecca Turner | Sylvia Landa | 54 | Realtor.com |
| Jasmine Lopez | Martine Goldberg | 51 | Google PPC |
| Sharon Swift | Kenny Chung | 43 | Google PPC |
| Ken Benson | Kenny Chung | 38 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 37 | TheRolandTeam.com |
| Pamela Cyrnek | Patty Cierley | 33 | TheRolandTeam.com |
| Henry Makekau | Misty Sumner | 23 | Jeffery Dragovich |
| Joseph Talamo | Patty Cierley | 22 | TheRolandTeam.com |
| Norma Holloway | Kenny Chung | 21 | Inbound Call |
| Renees Mendoza | Eric Graham | 17 | Google PPC |
| Laura Reeves | Jason Shawver | 16 | Zillow Preferred |
| Philip Rossovich | Patty Cierley | 16 | zbuyer.com |
| Lois Centeno | Kenny Chung | 16 | Ylopo |
| Jacqueline A Perez | Patty Cierley | 15 | zbuyer.com |
| Omar & Eylin Falbi | Anthony Ma | 14 | Jeffery Dragovich |
| Paul | Kate Frihse | 13 | Direct Traffic |
| Hasham Hanid | Sylvia Landa | 12 | Ylopo PPC+ |
| Edwin Morales | Patty Cierley | 11 | Zillow Preferred |
| Marlyn Peralta | Kenny Chung | 11 | zbuyer.com |
| Amanda Smith | Anthony Ma | 10 | Zillow Preferred |
| Dashawn Williams | Kenny Chung | 10 | Zillow Preferred |
| Zachary C Burkes | Patty Cierley | 9 | ISA Transfer |
| Terry | Nik Sharapov | 8 | Zillow Preferred |
| Angela Nickels | Misty Sumner | 8 | Zillow |
| Kiley Delapina Litogarcia | Kenny Chung | 6 | Zillow Preferred |
| Janai Walker | Patty Cierley | 4 | Zillow Preferred |
| Kelly Gafford | Eric Graham | 3 | Google PPC |
| Sammy Al Nobani | Kenny Chung | 3 | Zillow Preferred |
| Hugh McClimans | Liza Rivera | 3 | Citywide Long Form |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| my +plus leads | Portals & aggregators | 41 | 0 |
| Zillow Preferred | Zillow | 9 | 1 |
| TheRolandTeam.com | Website & organic | 3 | 0 |
| zbuyer.com | Zillow | 1 | 1 |
| Steve Hawks | Team & internal | 2 | 0 |
| Zillow | Zillow | 2 | 0 |
| Google PPC | Paid search & social | 1 | 0 |
| ISA Transfer | Team & internal | 1 | 0 |
| Ylopo | Portals & aggregators | 1 | 0 |
| Ylopo LSA | Portals & aggregators | 1 | 0 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 116 | 44 | (+163.6%) | 2026-09-03 ⚠ 44d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 44d older |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2006 | 4198 | (-52.2%) | 2026-09-03 ⚠ 44d older |
| 🎤 AI TEXT REPLIES | 6 | 10 | (-40.0%) | 2026-09-03 ⚠ 44d older |
| ‼️ YLOPO IMPORTANT | 102 | 116 | (-12.1%) | 2026-09-03 ⚠ 44d older |
| ⭐️ Team Leads (combined) | 821 | 767 | (+7.0%) | 2026-10-07 ⚠ 10d older |
| 📖 Current & Upcoming Clients | 468 | 451 | (+3.8%) | 2026-09-03 ⚠ 44d older |
| 💛 Sphere & Past Clients | 3307 | 3332 | (-0.8%) | 2026-09-03 ⚠ 44d older |

> **8 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2006 | 4200 | 271 / 168 / 1567 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3307 | 3332 | 237 / 7 / 3063 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 102 | 116 | 57 / 12 / 33 | 64 / 8 / 44 |
| 🏹 Zillow Important | 116 | 44 | 19 / 9 / 88 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 468 | 451 | 140 / 25 / 303 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 6 | 10 | 5 / 0 / 1 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 37 | 0 | 2 | 5.4% | 56.8% |
| Mike Roland | 414 | 0 | 19 | 4.6% | 71.7% |
| Quetza Adame | 23 | 0 | 1 | 4.3% | 87.0% |
| Misty Sumner | 30 | 0 | 1 | 3.3% | 66.7% |
| Sylvia Landa | 44 | 0 | 1 | 2.3% | 77.3% |
| Nik Sharapov | 67 | 0 | 1 | 1.5% | 94.0% |
| Adin Roland | 2575 | 0 | 9 | 0.3% | 95.6% |
| Patty Cierley | 71 | 0 | 0 | 0.0% | 95.8% |
| Paul Arroyo | 51 | 0 | 0 | 0.0% | 98.0% |
| Kenny Chung | 49 | 0 | 0 | 0.0% | 61.2% |
| Eric Graham | 40 | 0 | 0 | 0.0% | 90.0% |
| Karen Valdivia | 24 | 0 | 0 | 0.0% | 87.5% |
| Anthony Ma | 21 | 0 | 0 | 0.0% | 95.2% |
| Shantele Marcum | 13 | 0 | 0 | 0.0% | 100.0% |
| User 73 | 12 | 0 | 0 | 0.0% | 0.0% |
| Jason Shawver | 8 | 0 | 0 | 0.0% | 62.5% |
| Martine Goldberg | 7 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Lynda Hwang | 4 | 0 | 0 | 0.0% | 100.0% |
| Nicole Miller | 1 | 0 | 0 | 0.0% | 100.0% |
| Liza Rivera | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-10-17-svtv`