# Battr audit — 2026-11-03 (DRY RUN — nothing was written)

Run `2026-11-03-jydg` · **912 leads audited** of 49724 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **137** (0 new notes, 0 already flagged)
- Neglected: **16** (0 swept, 0 held back)
- Excluded: **8774** (8774 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **34** since the last run, **660** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **135** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Reactivated Ylopo leads (`Ylopo_Reactivated`) counted as worked on their last inbox message, to match Battr: **24** compliant lead(s) have it as their latest touch — none of them carry Battr's stamp, as expected
- Email counted as work: **275 manual**, 2742 automated (ignored), 0 undetermined — of 3017 row(s) read, 0 unusable
  - origin fields present on the sample: `actionPlanId`, `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 137 → 137 and neglected 16 → 16
- Paused agents: **1** on `Battr Paused`, holding 3495 lead(s) back from nudges and sweeps
- **137 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **16 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **17 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **137** at risk against Battr's **14** (2026-10-07). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 42 | 31% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 49 | 36% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 45 | 33% |
| **None of the above** — Battr should be flagging these too | **36** | 26% |

**45 of 137** are expected differences — the two sources you chose to sweep. **92** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **660**, timeframe-change timestamps on **8503**, of 49724 FUB records (`timeframeUpdated` 8503, `stageUpdated` 660).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 0 | 0 (—) | 0 |
| Only we flag them | 137 | 42 (31%) | 45 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Patty Cierley | 39 | 15 | 15 | 5 | 12 |
| Quetza Adame | 22 | 0 | 1 | 18 | 4 |
| Nik Sharapov | 19 | 7 | 12 | 2 | 5 |
| Shantele Marcum | 16 | 1 | 1 | 14 | 1 |
| Anthony Ma | 9 | 1 | 3 | 1 | 5 |
| Sylvia Landa | 8 | 6 | 5 | 0 | 1 |
| Nicole Miller | 5 | 5 | 5 | 3 | 0 |
| Misty Sumner | 4 | 2 | 1 | 0 | 2 |
| Jason Shawver | 4 | 2 | 2 | 0 | 1 |
| Martine Goldberg | 3 | 2 | 2 | 1 | 0 |
| Lynda Hwang | 3 | 1 | 2 | 0 | 1 |
| Karen Lakes | 2 | 0 | 0 | 0 | 2 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 50 |
| 🔥 Weekly Nurture | 10d | 28 |
| 😎 Bi-Weekly Nurture | 16d | 24 |
| 🌱 Monthly Nurture | 33d | 22 |
| 🌶️ Hot Leads | 2d | 8 |
| 👀 Quarterly Nurture | 93d | 5 |

### At risk here, not flagged by Battr — 92 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 43933 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Nurture | Real Geeks | call out, 27.2d ago |
| 63218 | Anthony Ma | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | timeframe change, 15.3d ago |
| 99742 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | text in, 23.4d ago |
| 100441 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | Citywide Long Form | call out, 21.1d ago |
| 101045 | Anthony Ma | 🌤️ Warm Back Up | 10d | Attempted Contact | Zillow Preferred | stage change, 20.8d ago |
| 101519 | Anthony Ma | 🌶️ Hot Leads | 2d | Attempted Contact | Zillow Preferred | stage change, 5.8d ago |
| 101552 | Anthony Ma | 🌶️ Hot Leads | 2d | Lead | Google LSA | call out, 6.1d ago |
| 101572 | Anthony Ma | 🌶️ Hot Leads | 2d | Lead | Direct Call | timeframe change, 4.1d ago |
| 100413 | Jason Shawver | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | stage change, 14.8d ago |
| 101189 | Jason Shawver | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | stage change, 18.8d ago |
| 101328 | Jason Shawver | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | stage change, 19.8d ago |
| 101526 | Jason Shawver | 🌶️ Hot Leads | 2d | Lead | Ylopo LSA | nothing in 100 days |
| 36325 | Karen Lakes | 🔥 Weekly Nurture | 10d | Spoke with Customer | TheRolandTeam.com | call out, 10.3d ago |
| 81931 | Karen Lakes | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | stage change, 14.8d ago |
| 60089 | Karen Valdivia | 😎 Bi-Weekly Nurture | 16d | Nurture | Google PPC | call out, 27.4d ago |
| 101494 | Kate Frihse | 🌤️ Warm Back Up | 10d | Lead | Ylopo LSA | nothing in 100 days |
| 66928 | Lynda Hwang | 🌱 Monthly Nurture | 33d | Nurture | zBuyer | timeframe change, 219d ago |
| 86590 | Lynda Hwang | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | email out, 36.4d ago |
| 86612 | Lynda Hwang | 👀 Quarterly Nurture | 93d | Nurture | Zillow Preferred | timeframe change, 99.5d ago |
| 99626 | Martine Goldberg | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 21.3d ago |
| 100821 | Martine Goldberg | 🌱 Monthly Nurture | 33d | Nurture | Ylopo PPC+ | call out, 42.2d ago |
| 88236 | Misty Sumner | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | email out, 12.5d ago |
| 100253 | Misty Sumner | 🌤️ Warm Back Up | 10d | Attempted Contact | ISA Transfer | call out, 14.2d ago |
| 101266 | Misty Sumner | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | call in, 17.6d ago |
| 101545 | Misty Sumner | 🌶️ Hot Leads | 2d | Lead | Ylopo LSA | nothing in 100 days |
| 68903 | Nicole Miller | 👀 Quarterly Nurture | 93d | Spoke with Customer | zbuyer.com | timeframe change, 103.2d ago |
| 71425 | Nicole Miller | 👀 Quarterly Nurture | 93d | Nurture | CallAction  > Riders | text out, 96.4d ago |
| 54111 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | Redfin | email out, 12d ago |
| 60368 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | Google PPC | email out, 12d ago |
| 63217 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Nurture | ISA Transfer | email out, 42d ago |
| 73578 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | zbuyer.com | email out, 55d ago |
| 82744 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Nurture | zbuyer.com | email out, 16d ago |
| 88190 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | Zillow Preferred | text out, 35.5d ago |
| 89293 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | email out, 45d ago |
| 89987 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | Zillow Preferred | email out, 36d ago |
| 96084 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | Zillow Preferred | text out, 42.4d ago |
| 97744 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | Zillow Preferred | email out, 20.4d ago |
| 98380 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | Citywide Long Form | call out, 14.2d ago |
| 99637 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | call out, 26.2d ago |
| 100047 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Nurture | zbuyer.com | email out, 20d ago |
| 100936 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | zbuyer.com | email out, 16d ago |
| 101301 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | email out, 12d ago |
| 101326 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | call out, 24.1d ago |
| 101524 | Nik Sharapov | 🌶️ Hot Leads | 2d | Lead | Ylopo LSA | nothing in 100 days |
| 37305 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | TheRolandTeam.com | text out, 38.2d ago |
| 42505 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow.com | text out, 35.4d ago |
| 48140 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | text out, 27d ago |
| 70629 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text out, 14.4d ago |
| 70858 | Patty Cierley | 🔥 Weekly Nurture | 10d | Spoke with Customer | ISA Transfer | stage change, 14.8d ago |
| 79398 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | text out, 38.2d ago |
| 80640 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text in, 11.2d ago |
| 83567 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 26.1d ago |
| 88938 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | text out, 43.5d ago |
| 89713 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | timeframe change, 35.4d ago |
| 89727 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | text out, 43.5d ago |
| 97709 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | timeframe change, 55.3d ago |
| 98230 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Citywide Long Form | call out, 21.1d ago |
| 98460 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text in, 14.2d ago |
| 99650 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | call out, 27.2d ago |
| 100087 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | zbuyer.com | call out, 26.3d ago |
| 100264 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | timeframe change, 11.4d ago |
| 100524 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 26.3d ago |
| 100603 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo PPC+ | text out, 18.3d ago |
| 100652 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text in, 18.3d ago |
| 100666 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow | call out, 15.3d ago |
| 101126 | Patty Cierley | 🌤️ Warm Back Up | 10d | Attempted Contact | zbuyer.com | call out, 11.4d ago |
| 101129 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | Noah Cash Offer | text in, 39.4d ago |
| 101198 | Patty Cierley | 🌱 Monthly Nurture | 33d | Spoke with Customer | Ylopo LSA | email out, 42.4d ago |
| 101258 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text in, 15.3d ago |
| 101294 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | zbuyer.com | timeframe change, 34.1d ago |
| 101401 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | stage change, 10.8d ago |
| 101414 | Patty Cierley | 🌤️ Warm Back Up | 10d | Lead | TheRolandTeam.com | call out, 15.1d ago |
| 101427 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | stage change, 17.9d ago |
| 101458 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | stage change, 10.8d ago |
| 101459 | Patty Cierley | 🌤️ Warm Back Up | 10d | Attempted Contact | Zillow Preferred | call out, 11.4d ago |
| 101462 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | stage change, 10.8d ago |
| 101468 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | stage change, 10.8d ago |
| 101498 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | call out, 11.5d ago |
| 62666 | Quetza Adame | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | timeframe change, 26.1d ago |
| 70783 | Quetza Adame | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | text out, 24.1d ago |
| … | 12 more | | | | | |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Patty Cierley | 133 | 39 | 2 | 0 |
| Quetza Adame | 33 | 22 | 0 | 0 |
| Nik Sharapov | 68 | 19 | 1 | 0 |
| Shantele Marcum | 31 | 16 | 1 | 0 |
| Anthony Ma | 42 | 9 | 3 | 0 |
| Sylvia Landa | 28 | 8 | 3 | 0 |
| Nicole Miller | 11 | 5 | 0 | 0 |
| Lynda Hwang | 25 | 3 | 1 | 0 |
| Jason Shawver | 17 | 4 | 0 | 0 |
| Misty Sumner | 14 | 4 | 0 | 0 |
| Martine Goldberg | 8 | 3 | 1 | 0 |
| Karen Lakes | 7 | 2 | 1 | 0 |
| Karen Valdivia | 11 | 1 | 1 | 0 |
| Liza Rivera | 3 | 1 | 1 | 0 |
| Kate Frihse | 3 | 1 | 1 | 0 |
| Eric Graham | 320 | 0 | 0 | 0 |
| Kenny Chung | 108 | 0 | 0 | 0 |
| Resty Valdeleon | 47 | 0 | 0 | 0 |
| Adin Roland | 2 | 0 | 0 | 0 |
| Jamie Zahorobsky | 1 | 0 | 0 | 0 |

## Inbound, never answered (39)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Rebecca Turner | Sylvia Landa | 71 | Realtor.com |
| Jasmine Lopez | Martine Goldberg | 68 | Google PPC |
| Sharon Swift | Kenny Chung | 60 | Google PPC |
| Ken Benson | Kenny Chung | 55 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 54 | TheRolandTeam.com |
| Pamela Cyrnek | Patty Cierley | 50 | TheRolandTeam.com |
| Henry Makekau | Misty Sumner | 40 | Jeffery Dragovich |
| Melanie Isbell | Patty Cierley | 39 | Noah Cash Offer |
| Joseph Talamo | Patty Cierley | 39 | TheRolandTeam.com |
| Norma Holloway | Kenny Chung | 38 | Inbound Call |
| Renees Mendoza | Eric Graham | 34 | Google PPC |
| Laura Reeves | Jason Shawver | 33 | Zillow Preferred |
| Philip Rossovich | Patty Cierley | 33 | zbuyer.com |
| Lois Centeno | Kenny Chung | 33 | Ylopo |
| Omar & Eylin Falbi | Anthony Ma | 31 | Jeffery Dragovich |
| Paul | Kate Frihse | 30 | Direct Traffic |
| Hasham Hanid | Sylvia Landa | 29 | Ylopo PPC+ |
| Marlyn Peralta | Kenny Chung | 28 | zbuyer.com |
| Diane Bloecker | Eric Graham | 28 | Google PPC |
| Dashawn Williams | Kenny Chung | 27 | Zillow Preferred |
| Terry | Nik Sharapov | 25 | Zillow Preferred |
| Angela Nickels | Misty Sumner | 25 | Zillow |
| Carol Bailey | Patty Cierley | 25 | zbuyer.com |
| Melissa Whitmire | Anthony Ma | 23 | TheRolandTeam.com |
| Kelly Gafford | Eric Graham | 20 | Google PPC |
| Hugh McClimans | Liza Rivera | 20 | Citywide Long Form |
| Ryan Robison | Patty Cierley | 18 | Zillow Preferred |
| Kenneth Riley | Misty Sumner | 17 | Zillow Preferred |
| CYROUS MOFAZELI | Jason Shawver | 15 | Zillow Preferred |
| Edwin Morales | Patty Cierley | 15 | Zillow Preferred |
| Chris Bennett | Sylvia Landa | 15 | Company |
| Mark Parisi | Patty Cierley | 14 | Zillow Preferred |
| Xavier Olson | Jason Shawver | 14 | Zillow Preferred |
| Adrian Garcia | Kenny Chung | 13 | Zillow Preferred |
| Jamy Jackson | Patty Cierley | 11 | Zillow Preferred |
| Lorena Sanchez | Patty Cierley | 11 | Zillow Preferred |
| Noelle Tillery | Patty Cierley | 11 | Zillow Preferred |
| Amanda Smith | Anthony Ma | 9 | Zillow Preferred |
| Miranda Lam | Shantele Marcum | 5 | zbuyer.com |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| Zillow Preferred | Zillow | 46 | 7 |
| my +plus leads | Portals & aggregators | 43 | 0 |
| zbuyer.com | Zillow | 8 | 0 |
| TheRolandTeam.com | Website & organic | 7 | 0 |
| Ylopo | Portals & aggregators | 5 | 2 |
| ISA Transfer | Team & internal | 3 | 2 |
| Ylopo LSA | Portals & aggregators | 5 | 0 |
| Google PPC | Paid search & social | 3 | 1 |
| Citywide Long Form | Portals & aggregators | 3 | 1 |
| Ylopo PPC+ | Portals & aggregators | 2 | 1 |
| Steve Hawks | Team & internal | 2 | 0 |
| Redfin | Portals & aggregators | 1 | 0 |
| Zillow | Zillow | 1 | 0 |
| Real Geeks | Portals & aggregators | 1 | 0 |
| Rocket Agents | Portals & aggregators | 0 | 1 |
| Noah Cash Offer | Seller & valuation | 1 | 0 |
| Direct Traffic | Website & organic | 0 | 1 |
| Kyle Nicholas McCray Referral | Team & internal | 1 | 0 |
| Zillow.com | Zillow | 1 | 0 |
| zBuyer | Zillow | 1 | 0 |
| CallAction  > Riders | Signs & mailers | 1 | 0 |
| Google LSA | Paid search & social | 1 | 0 |
| Direct Call | Team & internal | 1 | 0 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 114 | 44 | (+159.1%) | 2026-09-03 ⚠ 61d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 61d older |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2113 | 4198 | (-49.7%) | 2026-09-03 ⚠ 61d older |
| 🎤 AI TEXT REPLIES | 6 | 10 | (-40.0%) | 2026-09-03 ⚠ 61d older |
| ⭐️ Team Leads (combined) | 912 | 767 | (+18.9%) | 2026-10-07 ⚠ 27d older |
| 📖 Current & Upcoming Clients | 502 | 451 | (+11.3%) | 2026-09-03 ⚠ 61d older |
| ‼️ YLOPO IMPORTANT | 109 | 116 | (-6.0%) | 2026-09-03 ⚠ 61d older |
| 💛 Sphere & Past Clients | 3315 | 3332 | (-0.5%) | 2026-09-03 ⚠ 61d older |

> **8 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2113 | 4200 | 216 / 235 / 1662 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3315 | 3332 | 224 / 2 / 3089 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 109 | 116 | 41 / 32 / 36 | 64 / 8 / 44 |
| 🏹 Zillow Important | 114 | 44 | 25 / 8 / 81 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 502 | 451 | 118 / 22 / 362 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 6 | 10 | 5 / 1 / 0 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 41 | 0 | 2 | 4.9% | 34.1% |
| Mike Roland | 534 | 0 | 20 | 3.7% | 31.1% |
| Quetza Adame | 28 | 0 | 1 | 3.6% | 85.7% |
| Misty Sumner | 38 | 0 | 1 | 2.6% | 65.8% |
| Sylvia Landa | 62 | 0 | 1 | 1.6% | 80.6% |
| Nik Sharapov | 96 | 0 | 1 | 1.0% | 94.8% |
| Resty Valdeleon | 278 | 0 | 1 | 0.4% | 85.3% |
| Adin Roland | 3314 | 0 | 11 | 0.3% | 91.7% |
| Patty Cierley | 113 | 0 | 0 | 0.0% | 96.5% |
| Kenny Chung | 68 | 0 | 0 | 0.0% | 69.1% |
| Eric Graham | 62 | 0 | 0 | 0.0% | 93.5% |
| User 121 | 51 | 0 | 0 | 0.0% | 0.0% |
| Shantele Marcum | 36 | 0 | 0 | 0.0% | 100.0% |
| Anthony Ma | 34 | 0 | 0 | 0.0% | 94.1% |
| Karen Valdivia | 25 | 0 | 0 | 0.0% | 84.0% |
| Jason Shawver | 18 | 0 | 0 | 0.0% | 83.3% |
| Martine Goldberg | 13 | 0 | 0 | 0.0% | 100.0% |
| User 73 | 12 | 0 | 0 | 0.0% | 0.0% |
| Lynda Hwang | 5 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Nicole Miller | 3 | 0 | 0 | 0.0% | 100.0% |
| Karen Lakes | 2 | 0 | 0 | 0.0% | 100.0% |
| Liza Rivera | 1 | 0 | 0 | 0.0% | 100.0% |
| Jamie Zahorobsky | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-11-03-jydg`