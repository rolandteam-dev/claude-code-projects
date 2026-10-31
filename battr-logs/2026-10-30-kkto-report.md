# Battr audit — 2026-10-30 (DRY RUN — nothing was written)

Run `2026-10-30-kkto` · **907 leads audited** of 49682 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **111** (0 new notes, 0 already flagged)
- Neglected: **15** (0 swept, 0 held back)
- Excluded: **8773** (8773 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **13** since the last run, **589** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **132** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Reactivated Ylopo leads (`Ylopo_Reactivated`) counted as worked on their last inbox message, to match Battr: **24** compliant lead(s) have it as their latest touch — none of them carry Battr's stamp, as expected
- Email counted as work: **329 manual**, 1989 automated (ignored), 0 undetermined — of 2318 row(s) read, 0 unusable
  - origin fields present on the sample: `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 111 → 111 and neglected 15 → 15
- Paused agents: **1** on `Battr Paused`, holding 3488 lead(s) back from nudges and sweeps
- **111 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **15 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **17 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **111** at risk against Battr's **14** (2026-10-07). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 34 | 31% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 31 | 28% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 45 | 41% |
| **None of the above** — Battr should be flagging these too | **26** | 23% |

**45 of 111** are expected differences — the two sources you chose to sweep. **66** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **589**, timeframe-change timestamps on **8479**, of 49682 FUB records (`timeframeUpdated` 8479, `stageUpdated` 589).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 0 | 0 (—) | 0 |
| Only we flag them | 111 | 34 (31%) | 45 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Patty Cierley | 26 | 12 | 9 | 5 | 6 |
| Quetza Adame | 22 | 2 | 0 | 18 | 2 |
| Nik Sharapov | 16 | 5 | 9 | 2 | 5 |
| Shantele Marcum | 16 | 1 | 1 | 14 | 1 |
| Anthony Ma | 7 | 1 | 2 | 1 | 4 |
| Sylvia Landa | 5 | 5 | 3 | 0 | 0 |
| Misty Sumner | 3 | 1 | 2 | 0 | 1 |
| Nicole Miller | 3 | 3 | 2 | 3 | 0 |
| Jason Shawver | 3 | 0 | 0 | 0 | 3 |
| Martine Goldberg | 3 | 2 | 2 | 1 | 0 |
| Lynda Hwang | 2 | 1 | 1 | 0 | 1 |
| Karen Valdivia | 2 | 1 | 0 | 0 | 1 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 46 |
| 😎 Bi-Weekly Nurture | 16d | 23 |
| 🔥 Weekly Nurture | 10d | 18 |
| 🌱 Monthly Nurture | 33d | 14 |
| 🌶️ Hot Leads | 2d | 7 |
| 👀 Quarterly Nurture | 93d | 3 |

### At risk here, not flagged by Battr — 66 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 43933 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Nurture | Real Geeks | call out, 23.2d ago |
| 63218 | Anthony Ma | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | timeframe change, 11.2d ago |
| 99742 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | text in, 19.4d ago |
| 100441 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | Citywide Long Form | call out, 17.1d ago |
| 101045 | Anthony Ma | 🌤️ Warm Back Up | 10d | Attempted Contact | Zillow Preferred | stage change, 16.8d ago |
| 101552 | Anthony Ma | 🌶️ Hot Leads | 2d | Lead | Google LSA | call out, 2.1d ago |
| 100413 | Jason Shawver | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | stage change, 10.8d ago |
| 101328 | Jason Shawver | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | stage change, 15.8d ago |
| 101526 | Jason Shawver | 🌶️ Hot Leads | 2d | Lead | Ylopo LSA | nothing in 100 days |
| 81931 | Karen Lakes | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | stage change, 10.8d ago |
| 60089 | Karen Valdivia | 😎 Bi-Weekly Nurture | 16d | Nurture | Google PPC | call out, 23.4d ago |
| 100233 | Karen Valdivia | 😎 Bi-Weekly Nurture | 16d | Nurture | TheRolandTeam.com | call out, 17.2d ago |
| 101494 | Kate Frihse | 🌶️ Hot Leads | 2d | Lead | Ylopo LSA | nothing in 100 days |
| 54691 | Lynda Hwang | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | call out, 25d ago |
| 86612 | Lynda Hwang | 👀 Quarterly Nurture | 93d | Nurture | Zillow Preferred | timeframe change, 95.5d ago |
| 99626 | Martine Goldberg | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 17.2d ago |
| 100821 | Martine Goldberg | 🌱 Monthly Nurture | 33d | Nurture | Ylopo PPC+ | call out, 38.1d ago |
| 100253 | Misty Sumner | 🌤️ Warm Back Up | 10d | Attempted Contact | ISA Transfer | call out, 10.2d ago |
| 101266 | Misty Sumner | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | call in, 13.6d ago |
| 101545 | Misty Sumner | 🌶️ Hot Leads | 2d | Lead | Ylopo LSA | nothing in 100 days |
| 63217 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Nurture | ISA Transfer | email out, 38d ago |
| 73578 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | zbuyer.com | email out, 50.9d ago |
| 89293 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | email out, 41d ago |
| 96084 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | Zillow Preferred | text out, 38.4d ago |
| 97744 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | Zillow Preferred | email out, 16.4d ago |
| 98380 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | Citywide Long Form | call out, 10.2d ago |
| 99504 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Spoke with Customer | Citywide Long Form | email out, 11.5d ago |
| 99637 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | call out, 22.2d ago |
| 100047 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Nurture | zbuyer.com | email out, 16d ago |
| 100936 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | zbuyer.com | email out, 12d ago |
| 101245 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | zbuyer.com | email out, 16.5d ago |
| 101326 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | call out, 20d ago |
| 101493 | Nik Sharapov | 🌶️ Hot Leads | 2d | Attempted Contact | Zillow Preferred | call out, 2.3d ago |
| 101524 | Nik Sharapov | 🌶️ Hot Leads | 2d | Lead | Ylopo LSA | nothing in 100 days |
| 37305 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | TheRolandTeam.com | text out, 34.2d ago |
| 48140 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | text out, 23d ago |
| 70629 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text out, 10.3d ago |
| 70858 | Patty Cierley | 🔥 Weekly Nurture | 10d | Spoke with Customer | ISA Transfer | stage change, 10.8d ago |
| 79398 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | text out, 34.2d ago |
| 83567 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 22.1d ago |
| 88938 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | text out, 39.4d ago |
| 89727 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | text out, 39.4d ago |
| 97709 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | timeframe change, 51.2d ago |
| 98230 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Citywide Long Form | call out, 17.1d ago |
| 98460 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text in, 10.1d ago |
| 99650 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | call out, 23.2d ago |
| 100087 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | zbuyer.com | call out, 22.3d ago |
| 100524 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 22.3d ago |
| 100652 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text in, 14.2d ago |
| 100666 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow | call out, 11.3d ago |
| 101129 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | Noah Cash Offer | text in, 35.3d ago |
| 101198 | Patty Cierley | 🌱 Monthly Nurture | 33d | Spoke with Customer | Ylopo LSA | email out, 38.3d ago |
| 101258 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text in, 11.3d ago |
| 101414 | Patty Cierley | 🌤️ Warm Back Up | 10d | Lead | TheRolandTeam.com | call out, 11d ago |
| 101427 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | stage change, 13.8d ago |
| 62666 | Quetza Adame | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | timeframe change, 22.1d ago |
| 70783 | Quetza Adame | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | text out, 20.1d ago |
| 100654 | Quetza Adame | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | text out, 20d ago |
| 101344 | Quetza Adame | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | text out, 16.2d ago |
| 99301 | Shantele Marcum | 🌱 Monthly Nurture | 33d | Nurture | TheRolandTeam.com | call out, 34d ago |
| 100799 | Shantele Marcum | 🌤️ Warm Back Up | 10d | Attempted Contact | Zillow Preferred | call out, 12d ago |
| 41792 | Sylvia Landa | 🌱 Monthly Nurture | 33d | Nurture | Kyle Nicholas McCray Referral | call out, 39.4d ago |
| 60463 | Sylvia Landa | 👀 Quarterly Nurture | 93d | Nurture | Google PPC | timeframe change, 93d ago |
| 100774 | Sylvia Landa | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | timeframe change, 36.7d ago |
| 100934 | Sylvia Landa | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | call out, 30.1d ago |
| 101520 | Sylvia Landa | 🌶️ Hot Leads | 2d | Lead | Zillow Preferred | timeframe change, 4.4d ago |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Patty Cierley | 130 | 26 | 2 | 0 |
| Quetza Adame | 32 | 22 | 0 | 0 |
| Nik Sharapov | 65 | 16 | 1 | 0 |
| Shantele Marcum | 30 | 16 | 1 | 0 |
| Anthony Ma | 41 | 7 | 2 | 0 |
| Sylvia Landa | 27 | 5 | 3 | 0 |
| Martine Goldberg | 8 | 3 | 1 | 0 |
| Lynda Hwang | 25 | 2 | 1 | 0 |
| Jason Shawver | 17 | 3 | 0 | 0 |
| Misty Sumner | 14 | 3 | 0 | 0 |
| Nicole Miller | 11 | 3 | 0 | 0 |
| Karen Valdivia | 11 | 2 | 1 | 0 |
| Karen Lakes | 7 | 1 | 1 | 0 |
| Liza Rivera | 3 | 1 | 1 | 0 |
| Kate Frihse | 3 | 1 | 1 | 0 |
| Eric Graham | 322 | 0 | 0 | 0 |
| Kenny Chung | 106 | 0 | 0 | 0 |
| Resty Valdeleon | 52 | 0 | 0 | 0 |
| Adin Roland | 2 | 0 | 0 | 0 |
| Jamie Zahorobsky | 1 | 0 | 0 | 0 |

## Inbound, never answered (41)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Rebecca Turner | Sylvia Landa | 67 | Realtor.com |
| Jasmine Lopez | Martine Goldberg | 64 | Google PPC |
| Sharon Swift | Kenny Chung | 56 | Google PPC |
| Ken Benson | Kenny Chung | 51 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 50 | TheRolandTeam.com |
| Pamela Cyrnek | Patty Cierley | 46 | TheRolandTeam.com |
| Henry Makekau | Misty Sumner | 36 | Jeffery Dragovich |
| Melanie Isbell | Patty Cierley | 35 | Noah Cash Offer |
| Joseph Talamo | Patty Cierley | 35 | TheRolandTeam.com |
| Norma Holloway | Kenny Chung | 34 | Inbound Call |
| Renees Mendoza | Eric Graham | 30 | Google PPC |
| Laura Reeves | Jason Shawver | 29 | Zillow Preferred |
| Philip Rossovich | Patty Cierley | 29 | zbuyer.com |
| Lois Centeno | Kenny Chung | 29 | Ylopo |
| Omar & Eylin Falbi | Anthony Ma | 27 | Jeffery Dragovich |
| Paul | Kate Frihse | 26 | Direct Traffic |
| Hasham Hanid | Sylvia Landa | 25 | Ylopo PPC+ |
| Marlyn Peralta | Kenny Chung | 24 | zbuyer.com |
| Diane Bloecker | Eric Graham | 24 | Google PPC |
| Dashawn Williams | Kenny Chung | 23 | Zillow Preferred |
| Terry | Nik Sharapov | 21 | Zillow Preferred |
| Angela Nickels | Misty Sumner | 21 | Zillow |
| Carol Bailey | Patty Cierley | 21 | zbuyer.com |
| Melissa Whitmire | Anthony Ma | 19 | TheRolandTeam.com |
| Kelly Gafford | Eric Graham | 16 | Google PPC |
| Hugh McClimans | Liza Rivera | 16 | Citywide Long Form |
| Ryan Robison | Patty Cierley | 14 | Zillow Preferred |
| David Anthony Dion | Patty Cierley | 13 | Zillow Preferred |
| Kenneth Riley | Misty Sumner | 13 | Zillow Preferred |
| Mary Davis | Nik Sharapov | 12 | TheRolandTeam.com |
| CYROUS MOFAZELI | Jason Shawver | 11 | Zillow Preferred |
| Edwin Morales | Patty Cierley | 11 | Zillow Preferred |
| Chris Bennett | Sylvia Landa | 11 | Company |
| Mark Parisi | Patty Cierley | 10 | Zillow Preferred |
| Edward James Guiang G | Patty Cierley | 10 | Zillow Preferred |
| Xavier Olson | Jason Shawver | 10 | Zillow Preferred |
| Adrian Garcia | Kenny Chung | 9 | Zillow Preferred |
| Jamy Jackson | Patty Cierley | 7 | Zillow Preferred |
| Noelle Tillery | Patty Cierley | 7 | Zillow Preferred |
| Amanda Smith | Anthony Ma | 5 | Zillow Preferred |
| Nick (Amir) Quintero | Nik Sharapov | 3 | ISA Transfer |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| my +plus leads | Portals & aggregators | 43 | 0 |
| Zillow Preferred | Zillow | 30 | 6 |
| TheRolandTeam.com | Website & organic | 8 | 0 |
| Citywide Long Form | Portals & aggregators | 4 | 1 |
| ISA Transfer | Team & internal | 3 | 2 |
| zbuyer.com | Zillow | 5 | 0 |
| Ylopo | Portals & aggregators | 3 | 2 |
| Ylopo LSA | Portals & aggregators | 5 | 0 |
| Google PPC | Paid search & social | 2 | 1 |
| Steve Hawks | Team & internal | 2 | 0 |
| Ylopo PPC+ | Portals & aggregators | 1 | 1 |
| Zillow | Zillow | 1 | 0 |
| Real Geeks | Portals & aggregators | 1 | 0 |
| Rocket Agents | Portals & aggregators | 0 | 1 |
| Noah Cash Offer | Seller & valuation | 1 | 0 |
| Direct Traffic | Website & organic | 0 | 1 |
| Kyle Nicholas McCray Referral | Team & internal | 1 | 0 |
| Google LSA | Paid search & social | 1 | 0 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 118 | 44 | (+168.2%) | 2026-09-03 ⚠ 57d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 57d older |
| 🎤 AI TEXT REPLIES | 5 | 10 | (-50.0%) | 2026-09-03 ⚠ 57d older |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2114 | 4198 | (-49.6%) | 2026-09-03 ⚠ 57d older |
| ⭐️ Team Leads (combined) | 907 | 767 | (+18.3%) | 2026-10-07 ⚠ 23d older |
| 📖 Current & Upcoming Clients | 493 | 451 | (+9.3%) | 2026-09-03 ⚠ 57d older |
| ‼️ YLOPO IMPORTANT | 117 | 116 | (+0.9%) | 2026-09-03 ⚠ 57d older |
| 💛 Sphere & Past Clients | 3314 | 3332 | (-0.5%) | 2026-09-03 ⚠ 57d older |

> **8 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2114 | 4200 | 201 / 265 / 1648 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3314 | 3332 | 226 / 7 / 3081 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 117 | 116 | 55 / 24 / 38 | 64 / 8 / 44 |
| 🏹 Zillow Important | 118 | 44 | 33 / 6 / 79 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 493 | 451 | 122 / 24 / 347 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 5 | 10 | 4 / 1 / 0 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 41 | 0 | 2 | 4.9% | 34.1% |
| Quetza Adame | 26 | 0 | 1 | 3.8% | 84.6% |
| Mike Roland | 525 | 0 | 20 | 3.8% | 30.3% |
| Misty Sumner | 37 | 0 | 1 | 2.7% | 64.9% |
| Sylvia Landa | 60 | 0 | 1 | 1.7% | 80.0% |
| Nik Sharapov | 90 | 0 | 1 | 1.1% | 94.4% |
| Resty Valdeleon | 278 | 0 | 1 | 0.4% | 92.8% |
| Adin Roland | 3178 | 0 | 11 | 0.3% | 91.8% |
| Patty Cierley | 106 | 0 | 0 | 0.0% | 96.2% |
| Kenny Chung | 66 | 0 | 0 | 0.0% | 68.2% |
| Eric Graham | 57 | 0 | 0 | 0.0% | 94.7% |
| User 121 | 51 | 0 | 0 | 0.0% | 0.0% |
| Shantele Marcum | 35 | 0 | 0 | 0.0% | 100.0% |
| Anthony Ma | 33 | 0 | 0 | 0.0% | 93.9% |
| Karen Valdivia | 25 | 0 | 0 | 0.0% | 84.0% |
| Jason Shawver | 14 | 0 | 0 | 0.0% | 78.6% |
| User 73 | 12 | 0 | 0 | 0.0% | 0.0% |
| Martine Goldberg | 11 | 0 | 0 | 0.0% | 100.0% |
| Lynda Hwang | 5 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Nicole Miller | 3 | 0 | 0 | 0.0% | 100.0% |
| Karen Lakes | 2 | 0 | 0 | 0.0% | 100.0% |
| Liza Rivera | 1 | 0 | 0 | 0.0% | 100.0% |
| Jamie Zahorobsky | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-10-30-kkto`