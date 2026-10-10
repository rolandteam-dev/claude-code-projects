# Battr audit — 2026-10-09 (DRY RUN — nothing was written)

Run `2026-10-09-njto` · **816 leads audited** of 54185 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **53** (0 new notes, 0 already flagged)
- Neglected: **1** (0 swept, 0 held back)
- Excluded: **10854** (10854 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **14** since the last run, **201** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **113** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Reactivated Ylopo leads (`Ylopo_Reactivated`) counted as worked on their last inbox message, to match Battr: **40** compliant lead(s) have it as their latest touch — none of them carry Battr's stamp, as expected
- Email counted as work: **36 manual**, 619 automated (ignored), 0 undetermined — of 655 row(s) read, 0 unusable
  - origin fields present on the sample: `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 53 → 53 and neglected 1 → 1
- Paused agents: **1** on `Battr Paused`, holding 3645 lead(s) back from nudges and sweeps
- **53 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **1 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **17 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **53** at risk against Battr's **14** (2026-10-07). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 46 | 87% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 18 | 34% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 42 | 79% |
| **None of the above** — Battr should be flagging these too | **0** | 0% |

**42 of 53** are expected differences — the two sources you chose to sweep. **11** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **201**, timeframe-change timestamps on **8806**, of 54185 FUB records (`timeframeUpdated` 8806, `stageUpdated` 201).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 9 | 9 (100%) | 0 |
| Only we flag them | 44 | 37 (84%) | 42 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quetza Adame | 22 | 19 | 6 | 18 | 0 |
| Shantele Marcum | 12 | 8 | 0 | 12 | 0 |
| Patty Cierley | 8 | 8 | 2 | 6 | 0 |
| Nicole Miller | 4 | 4 | 4 | 3 | 0 |
| Liza Rivera | 1 | 1 | 1 | 1 | 0 |
| Kate Frihse | 1 | 1 | 1 | 0 | 0 |
| Nik Sharapov | 1 | 1 | 0 | 1 | 0 |
| Bruce Schneider | 1 | 1 | 1 | 0 | 0 |
| Martine Goldberg | 1 | 1 | 1 | 1 | 0 |
| Anthony Ma | 1 | 1 | 1 | 0 | 0 |
| Karen Lakes | 1 | 1 | 1 | 0 | 0 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 38 |
| 😎 Bi-Weekly Nurture | 16d | 9 |
| 👀 Quarterly Nurture | 93d | 3 |
| 🔥 Weekly Nurture | 10d | 2 |
| 🌱 Monthly Nurture | 33d | 1 |

### Leads Battr flagged in the last 3 days — do we agree?

Battr stamped **17** lead(s). We agree on **10** (9 at risk, 1 neglected); 4 compliant, 3 not on our list. For a lead we call worked, "our last touch" is the thing we count that Battr does not.

| FUB ID | Agent | Battr stamped | Our verdict | Our last touch | Window | Stage · timeframe id · source |
| ---: | --- | --- | --- | --- | ---: | --- |
| 99736 | Misty Sumner | 2026-10-09 | compliant | stage change, 0.7d ago | 10d | Nurture · 1 · Zillow Preferred |
| 100441 | Anthony Ma | 2026-10-09 | at risk | call out, 17.4d ago | 16d | Spoke with Customer · 2 · Citywide Long Form |
| 100633 | Misty Sumner | 2026-10-09 | compliant | stage change, 0.7d ago | 10d | Nurture · 1 · Zillow Preferred |
| 100824 | Misty Sumner | 2026-10-09 | compliant | stage change, 0.7d ago | 10d | Nurture · 1 · Zillow Preferred |
| 100889 | Misty Sumner | 2026-10-09 | compliant | stage change, 0.7d ago | 10d | Nurture · 1 · Zillow Preferred |
| 56502 | Bruce Schneider | 2026-10-08 | at risk | call in, 17.3d ago | 16d | Nurture · 2 · Company Websites |
| 70783 | Quetza Adame | 2026-10-08 | at risk | call out, 17.2d ago | 16d | Nurture · 2 · Zillow Preferred |
| 85089 | Kate Frihse | 2026-10-08 | at risk | text out, 11.3d ago | 10d | Attempted Contact · 1 · Zillow Preferred |
| 86626 | Nicole Miller | 2026-10-08 | at risk | call in, 94.2d ago | 93d | Nurture · 4 · HomeLight |
| 100654 | Quetza Adame | 2026-10-08 | at risk | call out, 17.2d ago | 16d | Nurture · 2 · Zillow Preferred |
| 100921 | Quetza Adame | 2026-10-08 | at risk | call out, 17.2d ago | 16d | Spoke with Customer · 2 · YouTube |
| 100945 | Quetza Adame | 2026-10-08 | at risk | call out, 17.3d ago | 16d | Nurture · 2 · zbuyer.com |
| 101362 | Kate Frihse | 2026-10-08 | neglected | nothing in 100 days | 2d | Lead · none · Noah Cash Offer |
| 98266 | Karen Lakes | 2026-10-07 | at risk | timeframe change, 95.1d ago | 93d | Nurture · 4 · Zillow Preferred |
| 101313 | Adin Roland | 2026-10-07 | not on our list | call out, 8.3d ago | —d | Attempted Contact · 1 · Zillow Preferred |
| 81931 | Adin Roland | 2026-10-06 | not on our list | call out, 13.4d ago | —d | Nurture · 1 · Zillow Preferred |
| 100312 | Adin Roland | 2026-10-06 | not on our list | call out, 25.1d ago | —d | Spoke with Customer · 1 · Citywide Long Form |

- Email-date rule check: **0 of 14** leads Battr flagged have a Follow Up Boss last-email date inside their window, as the rule assumes.

### Which Follow Up Boss date field is Battr's "last communication"?

Battr calls the 2 leads only we flag fine, so for most of them its field must be newer than the lead's window — and older for the 14 leads it flagged. A date field on the FUB record that does that is the candidate. Dates only.

No date field separates the two groups: nothing on the record explains the difference, so what Battr counts is not stored there.

### What sets the 2 leads only we flag apart from the 14 Battr stamped in the last 7 days

A pointer, not a proof — the groups are small. Something far commoner on our side is a candidate for what Battr treats as work, or as out of scope.

| More common among leads only we flag | Only us | Battr-flagged |
| --- | ---: | ---: |
| has field: lastSentEmail | 2 (100%) | 4 (29%) |
| has field: lastSentEmailId | 2 (100%) | 4 (29%) |
| has field: customSpeculoOutcomeDate | 2 (100%) | 4 (29%) |
| has field: customSpeculoRecentOutcome | 2 (100%) | 4 (29%) |
| tag: Mike Roland | 2 (100%) | 5 (36%) |
| timeframe id: 2 | 2 (100%) | 6 (43%) |
| tag: RETURNED | 2 (100%) | 6 (43%) |
| list: 😎 Bi-Weekly Nurture | 2 (100%) | 6 (43%) |
| has field: lastEmEventActivity | 2 (100%) | 6 (43%) |
| has field: lastEmEventActivityId | 2 (100%) | 6 (43%) |
| has field: customTotalLogins | 2 (100%) | 6 (43%) |
| tag: speculo_revive_flywheel | 2 (100%) | 7 (50%) |

| More common among leads Battr flagged | Only us | Battr-flagged |
| --- | ---: | ---: |
| has field: customBattrAtRiskSince | 0 (0%) | 14 (100%) |
| has field: lastSentText | 0 (0%) | 12 (86%) |
| has field: lastSentTextId | 0 (0%) | 12 (86%) |
| has field: lastText | 0 (0%) | 12 (86%) |
| has field: lastTextId | 0 (0%) | 12 (86%) |
| has field: lastIncomingCall | 0 (0%) | 10 (71%) |

### At risk here, not flagged by Battr — 2 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 100523 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 21.3d ago |
| 100776 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow | call out, 20.2d ago |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Quetza Adame | 33 | 22 | 0 | 0 |
| Shantele Marcum | 20 | 12 | 0 | 0 |
| Patty Cierley | 112 | 8 | 0 | 0 |
| Nicole Miller | 11 | 4 | 0 | 0 |
| Kate Frihse | 11 | 1 | 1 | 0 |
| Nik Sharapov | 57 | 1 | 0 | 0 |
| Anthony Ma | 30 | 1 | 0 | 0 |
| Bruce Schneider | 8 | 1 | 0 | 0 |
| Karen Lakes | 6 | 1 | 0 | 0 |
| Martine Goldberg | 6 | 1 | 0 | 0 |
| Liza Rivera | 3 | 1 | 0 | 0 |
| Eric Graham | 316 | 0 | 0 | 0 |
| Kenny Chung | 98 | 0 | 0 | 0 |
| Lynda Hwang | 25 | 0 | 0 | 0 |
| Sylvia Landa | 24 | 0 | 0 | 0 |
| Misty Sumner | 21 | 0 | 0 | 0 |
| Karen Valdivia | 11 | 0 | 0 | 0 |
| Jason Shawver | 10 | 0 | 0 | 0 |
| Paul Arroyo | 9 | 0 | 0 | 0 |
| Ginger Pace | 3 | 0 | 0 | 0 |
| Adin Roland | 1 | 0 | 0 | 0 |
| Jamie Zahorobsky | 1 | 0 | 0 | 0 |

## Inbound, never answered (32)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Andrew Keter | Nicole Miller | 94 | HomeLight |
| Teal McMillan | Patty Cierley | 92 | Redfin |
| Rico | Eric Graham | 83 | Zillow Preferred |
| Sabrina Ramirez | Lynda Hwang | 60 | Zillow Preferred |
| Rebecca Turner | Sylvia Landa | 46 | Realtor.com |
| Jasmine Lopez | Martine Goldberg | 43 | Google PPC |
| Wendy Hottel | Bruce Schneider | 36 | Bing PPC |
| Sharon Swift | Kenny Chung | 35 | Google PPC |
| Ken Benson | Kenny Chung | 30 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 29 | TheRolandTeam.com |
| Joey Burke | Misty Sumner | 26 | Zillow Preferred |
| Pamela Cyrnek | Patty Cierley | 25 | TheRolandTeam.com |
| Mike Fisher | Bruce Schneider | 17 | Company Websites |
| Henry Makekau | Misty Sumner | 15 | Jeffery Dragovich |
| Joseph Talamo | Patty Cierley | 14 | TheRolandTeam.com |
| Norma Holloway | Kenny Chung | 13 | Inbound Call |
| Mihailo Jovanovic | Sylvia Landa | 9 | TheRolandTeam.com |
| Renees Mendoza | Eric Graham | 9 | Google PPC |
| Gabby Chumbe-Sandoval | Nik Sharapov | 8 | Google Lsa |
| Laura Reeves | Jason Shawver | 8 | Zillow Preferred |
| Philip Rossovich | Patty Cierley | 8 | zbuyer.com |
| Lois Centeno | Kenny Chung | 8 | Ylopo |
| Jacqueline A Perez | Patty Cierley | 7 | zbuyer.com |
| James Korch | Sylvia Landa | 6 | zbuyer.com |
| Omar & Eylin Falbi | Anthony Ma | 6 | Jeffery Dragovich |
| Paul | Kate Frihse | 5 | Direct Traffic |
| Ryan Robison | Patty Cierley | 4 | Zillow Preferred |
| Hasham Hanid | Sylvia Landa | 4 | Ylopo PPC+ |
| Pam Hunter | Kate Frihse | 3 | Zillow Preferred |
| Marlyn Peralta | Kenny Chung | 3 | zbuyer.com |
| Amanda Smith | Anthony Ma | 2 | Zillow Preferred |
| Dashawn Williams | Kenny Chung | 2 | Zillow Preferred |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| my +plus leads | Portals & aggregators | 40 | 0 |
| Zillow Preferred | Zillow | 5 | 0 |
| Steve Hawks | Team & internal | 2 | 0 |
| Company Websites | Website & organic | 1 | 0 |
| Citywide Long Form | Portals & aggregators | 1 | 0 |
| Zillow | Zillow | 1 | 0 |
| YouTube | Paid search & social | 1 | 0 |
| zbuyer.com | Zillow | 1 | 0 |
| HomeLight | Portals & aggregators | 1 | 0 |
| Noah Cash Offer | Seller & valuation | 0 | 1 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 146 | 44 | (+231.8%) | 2026-09-03 ⚠ 36d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 36d older |
| 🎤 AI TEXT REPLIES | 11 | 10 | (+10.0%) | 2026-09-03 ⚠ 36d older |
| ‼️ YLOPO IMPORTANT | 108 | 116 | (-6.9%) | 2026-09-03 ⚠ 36d older |
| ⭐️ Team Leads (combined) | 816 | 767 | (+6.4%) | 2026-10-07 ⚠ 2d older |
| 📖 Current & Upcoming Clients | 472 | 451 | (+4.7%) | 2026-09-03 ⚠ 36d older |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4112 | 4198 | (-2.0%) | 2026-09-03 ⚠ 36d older |
| 💛 Sphere & Past Clients | 3343 | 3332 | (+0.3%) | 2026-09-03 ⚠ 36d older |

> **8 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 4112 | 4200 | 429 / 122 / 3561 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3343 | 3332 | 224 / 6 / 3113 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 108 | 116 | 61 / 10 / 37 | 64 / 8 / 44 |
| 🏹 Zillow Important | 146 | 44 | 25 / 7 / 114 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 472 | 451 | 144 / 14 / 314 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 11 | 10 | 9 / 0 / 2 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 35 | 0 | 2 | 5.7% | 65.7% |
| Quetza Adame | 21 | 0 | 1 | 4.8% | 95.2% |
| Mike Roland | 391 | 0 | 18 | 4.6% | 77.0% |
| Misty Sumner | 29 | 0 | 1 | 3.4% | 69.0% |
| Nik Sharapov | 57 | 0 | 1 | 1.8% | 93.0% |
| Adin Roland | 1747 | 0 | 5 | 0.3% | 95.0% |
| Patty Cierley | 56 | 0 | 0 | 0.0% | 96.4% |
| Kenny Chung | 42 | 0 | 0 | 0.0% | 59.5% |
| Sylvia Landa | 38 | 0 | 0 | 0.0% | 84.2% |
| Paul Arroyo | 35 | 0 | 0 | 0.0% | 100.0% |
| Eric Graham | 29 | 0 | 0 | 0.0% | 93.1% |
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
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-10-09-njto`