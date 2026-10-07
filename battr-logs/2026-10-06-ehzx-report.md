# Battr audit — 2026-10-06 (DRY RUN — nothing was written)

Run `2026-10-06-ehzx` · **817 leads audited** of 54162 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **64** (0 new notes, 0 already flagged)
- Neglected: **1** (0 swept, 0 held back)
- Excluded: **10860** (10860 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **21** since the last run, **117** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **105** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Reactivated Ylopo leads (`Ylopo_Reactivated`) counted as worked on their last inbox message, to match Battr: **50** compliant lead(s) have it as their latest touch — none of them carry Battr's stamp, as expected
- Email counted as work: **72 manual**, 747 automated (ignored), 0 undetermined — of 819 row(s) read, 0 unusable
  - origin fields present on the sample: `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 64 → 64 and neglected 1 → 1
- Paused agents: **1** on `Battr Paused`, holding 3663 lead(s) back from nudges and sweeps
- **64 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **1 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **18 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **64** at risk against Battr's **19** (2026-10-06). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 52 | 81% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 21 | 33% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 43 | 67% |
| **None of the above** — Battr should be flagging these too | **1** | 2% |

**43 of 64** are expected differences — the two sources you chose to sweep. **21** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **117**, timeframe-change timestamps on **8776**, of 54162 FUB records (`timeframeUpdated` 8776, `stageUpdated` 117).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 17 | 13 (76%) | 0 |
| Only we flag them | 47 | 39 (83%) | 43 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quetza Adame | 19 | 16 | 2 | 18 | 0 |
| Shantele Marcum | 13 | 9 | 0 | 12 | 0 |
| Patty Cierley | 9 | 9 | 2 | 6 | 0 |
| Nik Sharapov | 3 | 2 | 0 | 2 | 1 |
| Kenny Chung | 3 | 3 | 3 | 0 | 0 |
| Nicole Miller | 3 | 3 | 3 | 3 | 0 |
| Liza Rivera | 2 | 2 | 1 | 1 | 0 |
| Kate Frihse | 2 | 0 | 2 | 0 | 0 |
| Sylvia Landa | 2 | 2 | 2 | 0 | 0 |
| Anthony Ma | 2 | 1 | 2 | 0 | 0 |
| Karen Lakes | 1 | 1 | 0 | 0 | 0 |
| Bruce Schneider | 1 | 0 | 1 | 0 | 0 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 43 |
| 🔥 Weekly Nurture | 10d | 8 |
| 😎 Bi-Weekly Nurture | 16d | 5 |
| 🌱 Monthly Nurture | 33d | 3 |
| 🌶️ Hot Leads | 2d | 3 |
| 👀 Quarterly Nurture | 93d | 2 |

### Leads Battr flagged in the last 3 days — do we agree?

Battr stamped **27** lead(s). We agree on **18** (17 at risk, 1 neglected); 1 compliant, 8 not on our list. For a lead we call worked, "our last touch" is the thing we count that Battr does not.

| FUB ID | Agent | Battr stamped | Our verdict | Our last touch | Window | Stage · timeframe id · source |
| ---: | --- | --- | --- | --- | ---: | --- |
| 60089 | Karen Valdivia | 2026-10-06 | at risk | timeframe change, 16.2d ago | 16d | Nurture · 2 · Google PPC |
| 79268 | Nik Sharapov | 2026-10-06 | compliant | stage change, 0.7d ago | 10d | Nurture · 1 · Zillow Preferred |
| 81931 | Karen Lakes | 2026-10-06 | at risk | call out, 10.4d ago | 10d | Nurture · 1 · Zillow Preferred |
| 100312 | Shantele Marcum | 2026-10-06 | at risk | call out, 22.1d ago | 10d | Spoke with Customer · 1 · Citywide Long Form |
| 101126 | Patty Cierley | 2026-10-06 | at risk | text out, 10.2d ago | 10d | Attempted Contact · none · zbuyer.com |
| 101322 | Nik Sharapov | 2026-10-06 | at risk | email out, 3d ago | 2d | Attempted Contact · 1 · Zillow Preferred |
| 33546 | Adin Roland | 2026-10-05 | not on our list | stage change, 0.7d ago | —d | Attempted Contact · none · ISA Transfer |
| 63165 | Anthony Ma | 2026-10-05 | at risk | text out, 34.4d ago | 33d | Nurture · 3 · Zillow Preferred |
| 98037 | Kenny Chung | 2026-10-05 | at risk | call out, 94d ago | 93d | Spoke with Customer · 4 · TheRolandTeam.com |
| 100388 | Liza Rivera | 2026-10-05 | at risk | call out, 11.3d ago | 10d | Attempted Contact · none · Citywide Long Form |
| 101216 | Quetza Adame | 2026-10-05 | at risk | text out, 11.2d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 101337 | Misty Sumner | 2026-10-05 | neglected | timeframe change, 4.1d ago | 2d | Attempted Contact · 1 · Zillow Preferred |
| 101339 | Misty Sumner | 2026-10-05 | at risk | text out, 3d ago | 2d | Lead · 1 · Zillow Preferred |
| 52011 | Sylvia Landa | 2026-10-04 | at risk | call out, 12.4d ago | 10d | Nurture · 1 · ISA Transfer |
| 74697 | Lynda Hwang | 2026-10-04 | at risk | timeframe change, 98.5d ago | 33d | Nurture · 3 · Zillow Preferred |
| 81928 | Sylvia Landa | 2026-10-04 | at risk | text out, 12.2d ago | 10d | Spoke with Customer · 1 · zBuyer |
| 98100 | Bruce Schneider | 2026-10-04 | at risk | call out, 59.3d ago | 10d | Spoke with Customer · 1 · Zillow Preferred |
| 99556 | Anthony Ma | 2026-10-04 | at risk | call out, 18.4d ago | 16d | Spoke with Customer · 2 · Company |
| 101034 | Kate Frihse | 2026-10-04 | at risk | timeframe change, 12.4d ago | 10d | Attempted Contact · 1 · ISA Transfer |
| 101116 | Kenny Chung | 2026-10-04 | at risk | call out, 12.1d ago | 10d | Attempted Contact · 1 · Zillow Preferred |
| 101291 | Adin Roland | 2026-10-04 | not on our list | call in, 4.9d ago | —d | Lead · 1 · Noah Cash Offer |
| 36342 | Adin Roland | 2026-10-03 | not on our list | timeframe change, 36.3d ago | —d | Nurture · 3 · Google PPC |
| 39721 | Adin Roland | 2026-10-03 | not on our list | call out, 36.2d ago | —d | Nurture · 3 · Zillow.com |
| 56155 | Adin Roland | 2026-10-03 | not on our list | call out, 36.4d ago | —d | Nurture · 3 · Zillow.com |
| 100799 | Adin Roland | 2026-10-03 | not on our list | call out, 17.2d ago | —d | Attempted Contact · 1 · Zillow Preferred |
| 100869 | Adin Roland | 2026-10-03 | not on our list | call out, 13.3d ago | —d | Spoke with Customer · 1 · Zillow Preferred |
| 101316 | Adin Roland | 2026-10-03 | not on our list | nothing in 100 days | —d | Lead · none · Zillow Preferred |

- Email-date rule check: **0 of 20** leads Battr flagged have a Follow Up Boss last-email date inside their window, as the rule assumes.

### Which Follow Up Boss date field is Battr's "last communication"?

Battr calls the 4 leads only we flag fine, so for most of them its field must be newer than the lead's window — and older for the 20 leads it flagged. A date field on the FUB record that does that is the candidate. Dates only.

| FUB date field | Inside window — only us | Inside window — Battr-flagged |
| --- | ---: | ---: |
| `updated` | 4 of 4 (100%) | 14 of 20 (70%) |
| `lastActivity` | 4 of 4 (100%) | 14 of 20 (70%) |

### What sets the 4 leads only we flag apart from the 20 Battr stamped in the last 7 days

A pointer, not a proof — the groups are small. Something far commoner on our side is a candidate for what Battr treats as work, or as out of scope.

| More common among leads only we flag | Only us | Battr-flagged |
| --- | ---: | ---: |
| has field: customSpeculoOutcomeDate | 3 (75%) | 5 (25%) |
| has field: customSpeculoRecentOutcome | 3 (75%) | 5 (25%) |
| tag: RETURNED | 3 (75%) | 6 (30%) |
| has field: socialData | 3 (75%) | 7 (35%) |
| has field: customTotalLogins | 3 (75%) | 7 (35%) |
| tag: speculo_revive_flywheel | 3 (75%) | 8 (40%) |
| tag: speculo_voicemail | 2 (50%) | 4 (20%) |
| tag: DNC REGISTERED | 2 (50%) | 4 (20%) |
| tag: Y_DNC_REGISTRY_TRUE | 2 (50%) | 5 (25%) |

| More common among leads Battr flagged | Only us | Battr-flagged |
| --- | ---: | ---: |
| has field: customBattrAtRiskSince | 0 (0%) | 20 (100%) |
| timeframe id: 1 | 0 (0%) | 12 (60%) |
| has field: lastText | 1 (25%) | 15 (75%) |
| has field: lastTextId | 1 (25%) | 15 (75%) |
| has field: background | 0 (0%) | 10 (50%) |
| has field: lastSentText | 1 (25%) | 14 (70%) |

### At risk here, not flagged by Battr — 4 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 101362 | Kate Frihse | 🌶️ Hot Leads | 2d | Lead | Noah Cash Offer | nothing in 100 days |
| 100961 | Kenny Chung | 🌤️ Warm Back Up | 10d | Attempted Contact | zbuyer.com | call out, 10d ago |
| 100523 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 18.3d ago |
| 100776 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow | call out, 17.2d ago |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Quetza Adame | 33 | 19 | 0 | 0 |
| Shantele Marcum | 22 | 13 | 0 | 0 |
| Patty Cierley | 112 | 9 | 0 | 0 |
| Kenny Chung | 97 | 3 | 0 | 0 |
| Nik Sharapov | 60 | 3 | 0 | 0 |
| Nicole Miller | 11 | 3 | 0 | 0 |
| Anthony Ma | 32 | 2 | 0 | 0 |
| Sylvia Landa | 25 | 2 | 0 | 0 |
| Misty Sumner | 16 | 1 | 1 | 0 |
| Kate Frihse | 10 | 2 | 0 | 0 |
| Liza Rivera | 4 | 2 | 0 | 0 |
| Lynda Hwang | 26 | 1 | 0 | 0 |
| Karen Valdivia | 10 | 1 | 0 | 0 |
| Bruce Schneider | 9 | 1 | 0 | 0 |
| Karen Lakes | 6 | 1 | 0 | 0 |
| Martine Goldberg | 6 | 1 | 0 | 0 |
| Eric Graham | 319 | 0 | 0 | 0 |
| Jason Shawver | 10 | 0 | 0 | 0 |
| Paul Arroyo | 4 | 0 | 0 | 0 |
| Ginger Pace | 3 | 0 | 0 | 0 |
| Adin Roland | 1 | 0 | 0 | 0 |
| Jamie Zahorobsky | 1 | 0 | 0 | 0 |

## Inbound, never answered (31)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Angela Nickels | Misty Sumner | 93 | Zillow |
| Andrew Keter | Nicole Miller | 91 | HomeLight |
| Teal McMillan | Patty Cierley | 89 | Redfin |
| Rico | Eric Graham | 80 | Zillow Preferred |
| Sabrina Ramirez | Lynda Hwang | 57 | Zillow Preferred |
| Rebecca Turner | Sylvia Landa | 43 | Realtor.com |
| Jasmine Lopez | Martine Goldberg | 40 | Google PPC |
| Wendy Hottel | Bruce Schneider | 33 | Bing PPC |
| Sharon Swift | Kenny Chung | 32 | Google PPC |
| Ken Benson | Kenny Chung | 27 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 26 | TheRolandTeam.com |
| Pamela Cyrnek | Patty Cierley | 22 | TheRolandTeam.com |
| Mike Fisher | Bruce Schneider | 14 | Company Websites |
| Henry Makekau | Misty Sumner | 12 | Jeffery Dragovich |
| Joseph Talamo | Patty Cierley | 11 | TheRolandTeam.com |
| Janice Wilson | Kenny Chung | 10 | Zillow.com |
| Norma Holloway | Kenny Chung | 10 | Inbound Call |
| Mihailo Jovanovic | Sylvia Landa | 6 | TheRolandTeam.com |
| Renees Mendoza | Eric Graham | 6 | Google PPC |
| Rogelio Valencia | Eric Graham | 6 | Citywide Long Form |
| Amanda Smith | Anthony Ma | 6 | Zillow Preferred |
| Louie Ocello | Misty Sumner | 6 | Ylopo |
| Gabby Chumbe-Sandoval | Nik Sharapov | 5 | Google Lsa |
| Laura Reeves | Jason Shawver | 5 | Zillow Preferred |
| Philip Rossovich | Patty Cierley | 5 | zbuyer.com |
| Kathleen Bell | Eric Graham | 5 | TheRolandTeam.com |
| Jacqueline A Perez | Patty Cierley | 4 | zbuyer.com |
| James Korch | Sylvia Landa | 3 | zbuyer.com |
| Omar & Eylin Falbi | Anthony Ma | 3 | Jeffery Dragovich |
| Zachary C Burkes | Patty Cierley | 2 | ISA Transfer |
| Paul | Kate Frihse | 2 | Direct Traffic |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| my +plus leads | Portals & aggregators | 41 | 0 |
| Zillow Preferred | Zillow | 9 | 1 |
| Citywide Long Form | Portals & aggregators | 2 | 0 |
| zbuyer.com | Zillow | 2 | 0 |
| ISA Transfer | Team & internal | 2 | 0 |
| Steve Hawks | Team & internal | 2 | 0 |
| zBuyer | Zillow | 1 | 0 |
| Google PPC | Paid search & social | 1 | 0 |
| Company | Team & internal | 1 | 0 |
| Zillow | Zillow | 1 | 0 |
| TheRolandTeam.com | Website & organic | 1 | 0 |
| Noah Cash Offer | Seller & valuation | 1 | 0 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 148 | 44 | (+236.4%) | 2026-09-03 ⚠ 33d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 33d older |
| 🎤 AI TEXT REPLIES | 11 | 10 | (+10.0%) | 2026-09-03 ⚠ 33d older |
| 📖 Current & Upcoming Clients | 481 | 451 | (+6.7%) | 2026-09-03 ⚠ 33d older |
| ‼️ YLOPO IMPORTANT | 111 | 116 | (-4.3%) | 2026-09-03 ⚠ 33d older |
| ⭐️ Team Leads (combined) | 817 | 785 | +4.1% | 2026-10-06 |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4096 | 4198 | (-2.4%) | 2026-09-03 ⚠ 33d older |
| 💛 Sphere & Past Clients | 3342 | 3332 | (+0.3%) | 2026-09-03 ⚠ 33d older |

> **7 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4096 | 4200 | 433 / 89 / 3574 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3342 | 3332 | 228 / 3 / 3111 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 111 | 116 | 60 / 11 / 40 | 64 / 8 / 44 |
| 🏹 Zillow Important | 148 | 44 | 25 / 8 / 115 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 481 | 451 | 146 / 21 / 314 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 11 | 10 | 9 / 0 / 2 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 32 | 0 | 2 | 6.3% | 65.6% |
| Quetza Adame | 17 | 0 | 1 | 5.9% | 94.1% |
| Mike Roland | 389 | 0 | 18 | 4.6% | 81.2% |
| Nik Sharapov | 55 | 0 | 1 | 1.8% | 94.5% |
| Adin Roland | 1545 | 0 | 3 | 0.2% | 94.9% |
| Patty Cierley | 50 | 0 | 0 | 0.0% | 96.0% |
| Kenny Chung | 37 | 0 | 0 | 0.0% | 59.5% |
| Sylvia Landa | 36 | 0 | 0 | 0.0% | 88.9% |
| Eric Graham | 29 | 0 | 0 | 0.0% | 93.1% |
| Misty Sumner | 27 | 0 | 0 | 0.0% | 88.9% |
| Paul Arroyo | 27 | 0 | 0 | 0.0% | 100.0% |
| Karen Valdivia | 24 | 0 | 0 | 0.0% | 91.7% |
| Anthony Ma | 18 | 0 | 0 | 0.0% | 100.0% |
| Bruce Schneider | 12 | 0 | 0 | 0.0% | 75.0% |
| Jason Shawver | 8 | 0 | 0 | 0.0% | 62.5% |
| Martine Goldberg | 6 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Lynda Hwang | 4 | 0 | 0 | 0.0% | 100.0% |
| Shantele Marcum | 2 | 0 | 0 | 0.0% | 100.0% |
| Nicole Miller | 1 | 0 | 0 | 0.0% | 100.0% |
| Liza Rivera | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-10-06-ehzx`