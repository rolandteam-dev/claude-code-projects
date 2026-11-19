# Battr audit — 2026-11-16 (DRY RUN — nothing was written)

Run `2026-11-16-npfa` · **959 leads audited** of 49856 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **166** (0 new notes, 0 already flagged)
- Neglected: **12** (0 swept, 0 held back)
- Excluded: **8789** (8789 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **29** since the last run, **883** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **146** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Reactivated Ylopo leads (`Ylopo_Reactivated`) counted as worked on their last inbox message, to match Battr: **24** compliant lead(s) have it as their latest touch — none of them carry Battr's stamp, as expected
- Email counted as work: **236 manual**, 3419 automated (ignored), 0 undetermined — of 3655 row(s) read, 0 unusable
  - origin fields present on the sample: `actionPlanId`, `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 166 → 166 and neglected 12 → 12
- Paused agents: **1** on `Battr Paused`, holding 3498 lead(s) back from nudges and sweeps
- **166 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **12 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **19 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **166** at risk against Battr's **14** (2026-10-07). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 96 | 58% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 48 | 29% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 45 | 27% |
| **None of the above** — Battr should be flagging these too | **38** | 23% |

**45 of 166** are expected differences — the two sources you chose to sweep. **121** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **883**, timeframe-change timestamps on **8611**, of 49856 FUB records (`timeframeUpdated` 8611, `stageUpdated` 883).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 0 | 0 (—) | 0 |
| Only we flag them | 166 | 96 (58%) | 45 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Patty Cierley | 46 | 28 | 7 | 5 | 14 |
| Quetza Adame | 21 | 11 | 3 | 18 | 0 |
| Shantele Marcum | 19 | 11 | 3 | 14 | 2 |
| Anthony Ma | 18 | 10 | 9 | 1 | 7 |
| Nik Sharapov | 17 | 11 | 7 | 2 | 3 |
| Sylvia Landa | 12 | 6 | 6 | 0 | 4 |
| Nicole Miller | 6 | 5 | 4 | 3 | 0 |
| Misty Sumner | 5 | 4 | 1 | 0 | 1 |
| Jason Shawver | 5 | 0 | 2 | 0 | 3 |
| Lynda Hwang | 5 | 3 | 5 | 0 | 0 |
| Resty Valdeleon | 2 | 1 | 0 | 0 | 1 |
| Karen Valdivia | 2 | 2 | 0 | 0 | 0 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 52 |
| 🌱 Monthly Nurture | 33d | 42 |
| 🔥 Weekly Nurture | 10d | 31 |
| 😎 Bi-Weekly Nurture | 16d | 29 |
| 👀 Quarterly Nurture | 93d | 8 |
| 🌶️ Hot Leads | 2d | 4 |

### At risk here, not flagged by Battr — 121 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 99903 | Adin Roland | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | call out, 18.2d ago |
| 43933 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Nurture | Real Geeks | call out, 40.2d ago |
| 50505 | Anthony Ma | 🔥 Weekly Nurture | 10d | Nurture | Zillow.com | stage change, 11.8d ago |
| 53263 | Anthony Ma | 🔥 Weekly Nurture | 10d | Nurture | Sign Calls/Mailers | timeframe change, 21.1d ago |
| 59320 | Anthony Ma | 👀 Quarterly Nurture | 93d | Nurture | Ylopo | call out, 95.1d ago |
| 63218 | Anthony Ma | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | timeframe change, 28.3d ago |
| 80618 | Anthony Ma | 🌱 Monthly Nurture | 33d | Spoke with Customer | Zillow Preferred | call out, 34.1d ago |
| 86239 | Anthony Ma | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | call out, 42.1d ago |
| 99521 | Anthony Ma | 🌱 Monthly Nurture | 33d | Nurture | TheRolandTeam.com | call out, 37.2d ago |
| 99742 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | text in, 36.4d ago |
| 100142 | Anthony Ma | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | call out, 11.4d ago |
| 100441 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | Citywide Long Form | call out, 34.1d ago |
| 101417 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 21.2d ago |
| 101552 | Anthony Ma | 🌤️ Warm Back Up | 10d | Lead | Google LSA | call out, 19.1d ago |
| 101572 | Anthony Ma | 🌤️ Warm Back Up | 10d | Lead | Direct Call | timeframe change, 17.1d ago |
| 101628 | Anthony Ma | 🌤️ Warm Back Up | 10d | Attempted Contact | Zillow Preferred | call out, 12d ago |
| 101754 | Anthony Ma | 🌶️ Hot Leads | 2d | Lead | Zillow Preferred | text out, 6.5d ago |
| 101769 | Anthony Ma | 🌶️ Hot Leads | 2d | Lead | Zillow Preferred | timeframe change, 5.4d ago |
| 54717 | Eric Graham | 🌱 Monthly Nurture | 33d | Nurture | Google PPC | timeframe change, 33.4d ago |
| 86534 | Eric Graham | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | call out, 21.2d ago |
| 100413 | Jason Shawver | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | stage change, 27.8d ago |
| 100516 | Jason Shawver | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | text out, 28.4d ago |
| 101001 | Jason Shawver | 🌱 Monthly Nurture | 33d | Spoke with Customer | TheRolandTeam.com | call out, 38.3d ago |
| 101328 | Jason Shawver | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | call out, 10.3d ago |
| 101533 | Jason Shawver | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | call out, 11.2d ago |
| 101104 | Karen Lakes | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | zbuyer.com | stage change, 21.8d ago |
| 34689 | Karen Valdivia | 🌱 Monthly Nurture | 33d | Nurture | Google PPC | timeframe change, 40.2d ago |
| 60089 | Karen Valdivia | 😎 Bi-Weekly Nurture | 16d | Nurture | Google PPC | call out, 40.4d ago |
| 101494 | Kate Frihse | 🌤️ Warm Back Up | 10d | Lead | Ylopo LSA | nothing in 100 days |
| 89026 | Kenny Chung | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | text out, 13.1d ago |
| 66928 | Lynda Hwang | 🌱 Monthly Nurture | 33d | Nurture | zBuyer | timeframe change, 232d ago |
| 86590 | Lynda Hwang | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | email out, 49.4d ago |
| 86612 | Lynda Hwang | 👀 Quarterly Nurture | 93d | Nurture | Zillow Preferred | timeframe change, 112.5d ago |
| 88961 | Lynda Hwang | 👀 Quarterly Nurture | 93d | Nurture | Ylopo | timeframe change, 189.2d ago |
| 98328 | Lynda Hwang | 👀 Quarterly Nurture | 93d | Nurture | Zillow Preferred | timeframe change, 150.4d ago |
| 95574 | Misty Sumner | 😎 Bi-Weekly Nurture | 16d | Nurture | ISA Transfer | stage change, 17.8d ago |
| 100253 | Misty Sumner | 🌤️ Warm Back Up | 10d | Attempted Contact | ISA Transfer | call out, 27.2d ago |
| 100812 | Misty Sumner | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | stage change, 38.8d ago |
| 101551 | Misty Sumner | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | timeframe change, 19.1d ago |
| 101802 | Misty Sumner | 🌶️ Hot Leads | 2d | Attempted Contact | Zillow Preferred | text out, 2.2d ago |
| 68903 | Nicole Miller | 👀 Quarterly Nurture | 93d | Spoke with Customer | zbuyer.com | timeframe change, 116.2d ago |
| 71425 | Nicole Miller | 👀 Quarterly Nurture | 93d | Nurture | CallAction  > Riders | timeframe change, 258.2d ago |
| 100191 | Nicole Miller | 🌱 Monthly Nurture | 33d | Spoke with Customer | TheRolandTeam.com | call out, 42.3d ago |
| 60344 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | Leadpops - Google Ads | email out, 44d ago |
| 63217 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Nurture | ISA Transfer | email out, 55d ago |
| 73578 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | zbuyer.com | email out, 68d ago |
| 79957 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | text out, 39.2d ago |
| 82744 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Nurture | zbuyer.com | email out, 29d ago |
| 89293 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | email out, 58d ago |
| 89987 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | Zillow Preferred | email out, 49d ago |
| 96046 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Nurture | Zillow | call out, 21.1d ago |
| 99637 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | call out, 39.2d ago |
| 100047 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Nurture | zbuyer.com | email out, 33d ago |
| 101301 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | email out, 25d ago |
| 101524 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Lead | Ylopo LSA | nothing in 100 days |
| 101569 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | Ylopo | email out, 13.4d ago |
| 101596 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Lead | Google LSA | text out, 14.3d ago |
| 101753 | Nik Sharapov | 🌶️ Hot Leads | 2d | Attempted Contact | Zillow Preferred | call out, 2.4d ago |
| 35654 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | TheRolandTeam.com | text out, 44d ago |
| 37305 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | TheRolandTeam.com | text out, 51.2d ago |
| 48140 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | text out, 40d ago |
| 48247 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Bing PPC | text out, 42d ago |
| 50283 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | TheRolandTeam.com | call out, 24.4d ago |
| 58604 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Google PPC | text out, 44d ago |
| 63390 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | text out, 42d ago |
| 70629 | Patty Cierley | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | text out, 10.4d ago |
| 70858 | Patty Cierley | 🔥 Weekly Nurture | 10d | Spoke with Customer | ISA Transfer | stage change, 27.8d ago |
| 71402 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | zbuyer.com | call out, 42.3d ago |
| 72826 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | zbuyer.com | text out, 67.5d ago |
| 74492 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | zbuyer.com | text out, 25.3d ago |
| 79986 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | zbuyer.com | text out, 70d ago |
| 83567 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 39.1d ago |
| 89713 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | timeframe change, 48.4d ago |
| 89727 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | text out, 56.5d ago |
| 95301 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Citywide Long Form | call out, 37.2d ago |
| 98230 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Citywide Long Form | call out, 34.1d ago |
| 98274 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | TheRolandTeam.com | call out, 42.3d ago |
| 98445 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | call out, 24.4d ago |
| 99496 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | zbuyer.com | timeframe change, 43.3d ago |
| 99646 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Citywide Long Form | text out, 25.3d ago |
| … | 41 more | | | | | |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Patty Cierley | 133 | 46 | 2 | 0 |
| Quetza Adame | 39 | 21 | 0 | 0 |
| Anthony Ma | 45 | 18 | 1 | 0 |
| Shantele Marcum | 36 | 19 | 0 | 0 |
| Nik Sharapov | 77 | 17 | 1 | 0 |
| Sylvia Landa | 32 | 12 | 3 | 0 |
| Lynda Hwang | 24 | 5 | 1 | 0 |
| Nicole Miller | 11 | 6 | 0 | 0 |
| Jason Shawver | 20 | 5 | 0 | 0 |
| Misty Sumner | 18 | 5 | 0 | 0 |
| Karen Valdivia | 11 | 2 | 1 | 0 |
| Eric Graham | 331 | 2 | 0 | 0 |
| Resty Valdeleon | 45 | 2 | 0 | 0 |
| Martine Goldberg | 11 | 1 | 1 | 0 |
| Karen Lakes | 6 | 1 | 1 | 0 |
| Kate Frihse | 3 | 1 | 1 | 0 |
| Kenny Chung | 111 | 1 | 0 | 0 |
| Liza Rivera | 3 | 1 | 0 | 0 |
| Adin Roland | 2 | 1 | 0 | 0 |
| Jamie Zahorobsky | 1 | 0 | 0 | 0 |

## Inbound, never answered (49)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Rebecca Turner | Sylvia Landa | 84 | Realtor.com |
| Jasmine Lopez | Martine Goldberg | 81 | Google PPC |
| Ken Benson | Kenny Chung | 68 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 67 | TheRolandTeam.com |
| Pamela Cyrnek | Patty Cierley | 63 | TheRolandTeam.com |
| Henry Makekau | Misty Sumner | 53 | Jeffery Dragovich |
| Melanie Isbell | Patty Cierley | 52 | Noah Cash Offer |
| Joseph Talamo | Patty Cierley | 52 | TheRolandTeam.com |
| Norma Holloway | Kenny Chung | 51 | Inbound Call |
| Renees Mendoza | Eric Graham | 47 | Google PPC |
| Philip Rossovich | Patty Cierley | 46 | zbuyer.com |
| Lois Centeno | Kenny Chung | 46 | Ylopo |
| Omar & Eylin Falbi | Anthony Ma | 44 | Jeffery Dragovich |
| Paul | Kate Frihse | 43 | Direct Traffic |
| Hasham Hanid | Sylvia Landa | 42 | Ylopo PPC+ |
| Pam Hunter | Misty Sumner | 41 | Zillow Preferred |
| Diane Bloecker | Eric Graham | 41 | Google PPC |
| Dashawn Williams | Kenny Chung | 40 | Zillow Preferred |
| Angela Nickels | Misty Sumner | 38 | Zillow |
| Carol Bailey | Patty Cierley | 38 | zbuyer.com |
| Melissa Whitmire | Anthony Ma | 36 | TheRolandTeam.com |
| Hugh McClimans | Liza Rivera | 33 | Citywide Long Form |
| Kenneth Riley | Misty Sumner | 30 | Zillow Preferred |
| CYROUS MOFAZELI | Jason Shawver | 28 | Zillow Preferred |
| Edwin Morales | Patty Cierley | 28 | Zillow Preferred |
| Chris Bennett | Sylvia Landa | 28 | Company |
| Xavier Olson | Jason Shawver | 27 | Zillow Preferred |
| Shannon Lynch | Eric Graham | 26 | Zillow Preferred |
| Noelle Tillery | Patty Cierley | 24 | Zillow Preferred |
| Amanda Smith | Anthony Ma | 22 | Zillow Preferred |
| Jordan | Shantele Marcum | 19 | Direct Call |
| Miranda Lam | Shantele Marcum | 18 | zbuyer.com |
| Nick (Amir) Quintero | Nik Sharapov | 14 | ISA Transfer |
| Jikai | Resty Valdeleon | 14 | Zillow Preferred |
| Mary Davis | Nik Sharapov | 13 | TheRolandTeam.com |
| Janice Wilson | Kenny Chung | 13 | Zillow.com |
| Riley Page | Kenny Chung | 12 | Zillow Preferred |
| Michael Zahn | Anthony Ma | 11 | Zillow Preferred |
| Craig Kiernan | Resty Valdeleon | 11 | ReferralExchange |
| Rick Graham | Shantele Marcum | 11 | Google PPC |
| Lorena Sanchez | Patty Cierley | 10 | Zillow Preferred |
| Laura Reeves | Jason Shawver | 9 | Zillow Preferred |
| Argentina Melchiir | Patty Cierley | 7 | Zillow Preferred |
| Jessica Redden | Liza Rivera | 5 | Zillow Preferred |
| Charlotte Mannino | Nicole Miller | 4 | Zillow Preferred |
| Joe Gainers | Eric Graham | 4 | Zillow.com |
| Shakira Burton | Nik Sharapov | 4 | Zillow Preferred |
| Chang Ahn | Kenny Chung | 3 | Zillow Preferred |
| Xavier Garcia | Martine Goldberg | 2 | Zillow Preferred |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| Zillow Preferred | Zillow | 43 | 3 |
| my +plus leads | Portals & aggregators | 43 | 0 |
| zbuyer.com | Zillow | 17 | 0 |
| TheRolandTeam.com | Website & organic | 14 | 0 |
| Ylopo | Portals & aggregators | 12 | 2 |
| ISA Transfer | Team & internal | 5 | 2 |
| Google PPC | Paid search & social | 5 | 1 |
| Citywide Long Form | Portals & aggregators | 4 | 1 |
| Ylopo LSA | Portals & aggregators | 3 | 0 |
| Google LSA | Paid search & social | 2 | 0 |
| Direct Call | Team & internal | 2 | 0 |
| Zillow.com | Zillow | 2 | 0 |
| Zillow | Zillow | 2 | 0 |
| Steve Hawks | Team & internal | 2 | 0 |
| Ylopo PPC+ | Portals & aggregators | 1 | 1 |
| Sign Calls/Mailers | Signs & mailers | 1 | 0 |
| YouTube | Paid search & social | 1 | 0 |
| Real Geeks | Portals & aggregators | 1 | 0 |
| Rocket Agents | Portals & aggregators | 0 | 1 |
| Noah Cash Offer | Seller & valuation | 1 | 0 |
| Direct Traffic | Website & organic | 0 | 1 |
| Kyle Nicholas McCray Referral | Team & internal | 1 | 0 |
| Bing PPC | Paid search & social | 1 | 0 |
| Leadpops - Google Ads | Paid search & social | 1 | 0 |
| zBuyer | Zillow | 1 | 0 |
| CallAction  > Riders | Signs & mailers | 1 | 0 |

## Side by side with Battr — the running record

| List | Ours | Battr | Drift | Battr's row read |
| --- | ---: | ---: | ---: | --- |
| 🏹 Zillow Important | 143 | 44 | (+225.0%) | 2026-09-03 ⚠ 74d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 74d older |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2106 | 4198 | (-49.8%) | 2026-09-03 ⚠ 74d older |
| 🎤 AI TEXT REPLIES | 7 | 10 | (-30.0%) | 2026-09-03 ⚠ 74d older |
| ⭐️ Team Leads (combined) | 959 | 767 | (+25.0%) | 2026-10-07 ⚠ 40d older |
| 📖 Current & Upcoming Clients | 517 | 451 | (+14.6%) | 2026-09-03 ⚠ 74d older |
| ‼️ YLOPO IMPORTANT | 112 | 116 | (-3.4%) | 2026-09-03 ⚠ 74d older |
| 💛 Sphere & Past Clients | 3316 | 3332 | (-0.5%) | 2026-09-03 ⚠ 74d older |

> **8 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2106 | 4200 | 274 / 96 / 1736 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3316 | 3332 | 215 / 7 / 3094 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 112 | 116 | 27 / 41 / 44 | 64 / 8 / 44 |
| 🏹 Zillow Important | 143 | 44 | 33 / 7 / 103 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 517 | 451 | 148 / 34 / 335 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 7 | 10 | 5 / 2 / 0 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 41 | 0 | 2 | 4.9% | 34.1% |
| Mike Roland | 550 | 0 | 21 | 3.8% | 31.3% |
| Quetza Adame | 41 | 0 | 1 | 2.4% | 87.8% |
| Misty Sumner | 46 | 0 | 1 | 2.2% | 69.6% |
| Sylvia Landa | 67 | 0 | 1 | 1.5% | 80.6% |
| Nik Sharapov | 114 | 0 | 1 | 0.9% | 95.6% |
| Resty Valdeleon | 280 | 0 | 1 | 0.4% | 79.6% |
| Adin Roland | 3712 | 0 | 12 | 0.3% | 91.0% |
| Kenny Chung | 162 | 0 | 0 | 0.0% | 38.9% |
| Patty Cierley | 128 | 0 | 0 | 0.0% | 96.1% |
| Eric Graham | 82 | 0 | 0 | 0.0% | 92.7% |
| User 121 | 51 | 0 | 0 | 0.0% | 0.0% |
| Anthony Ma | 50 | 0 | 0 | 0.0% | 96.0% |
| Shantele Marcum | 45 | 0 | 0 | 0.0% | 95.6% |
| Karen Valdivia | 26 | 0 | 0 | 0.0% | 80.8% |
| Jason Shawver | 24 | 0 | 0 | 0.0% | 79.2% |
| Martine Goldberg | 17 | 0 | 0 | 0.0% | 100.0% |
| User 73 | 12 | 0 | 0 | 0.0% | 0.0% |
| Lynda Hwang | 7 | 0 | 0 | 0.0% | 100.0% |
| Nicole Miller | 4 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Karen Lakes | 2 | 0 | 0 | 0.0% | 100.0% |
| Liza Rivera | 1 | 0 | 0 | 0.0% | 100.0% |
| Jamie Zahorobsky | 1 | 0 | 0 | 0.0% | 100.0% |
| Robby Mendoza | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-11-16-npfa`