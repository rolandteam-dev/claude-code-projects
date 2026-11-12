# Battr audit — 2026-11-11 (DRY RUN — nothing was written)

Run `2026-11-11-gzlb` · **938 leads audited** of 49880 pulled from Follow Up Boss · thresholds: per list (2/4 Hot … 93/96 Quarterly)

> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS
>
> Follow Up Boss would not serve **texts** in bulk: `{"errorMessage":"personId, threadId, phone, toNumber, fromNumber, sharedInboxId, groupTextId, participants, or id list must be specified for GET \/v1\/textMessages."}`
>
> Every lead below is judged on the channels that *could* be read. A lead an agent has only ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the engine will not take a lead off an agent on evidence it knows is partial.


## Summary

- At Risk: **158** (0 new notes, 0 already flagged)
- Neglected: **12** (0 swept, 0 held back)
- Excluded: **8782** (8782 never entered the audit list, 0 removed after it)
- Stage changes counted as work: **36** since the last run, **812** lead(s) carry one (tracking since 2026-10-01)
- Follow Up Boss last-email dates counted as work: **145** audited lead(s) have one as their latest touch (`lastSentEmail`, `lastEmail`)
- Reactivated Ylopo leads (`Ylopo_Reactivated`) counted as worked on their last inbox message, to match Battr: **25** compliant lead(s) have it as their latest touch — none of them carry Battr's stamp, as expected
- Email counted as work: **278 manual**, 3310 automated (ignored), 0 undetermined — of 3588 row(s) read, 0 unusable
  - origin fields present on the sample: `actionPlanId`, `campaignOrigin`, `emailTemplateId`, `userId`
  - it moved at risk 158 → 158 and neglected 12 → 12
- Paused agents: **1** on `Battr Paused`, holding 3497 lead(s) back from nudges and sweeps
- **158 nudges skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **12 sweeps skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it
- **19 agent alerts skipped today** — texts backfilled per person and complete — set rules.sweepOnBackfilledTexts to act on it

## Why our at-risk count is higher than Battr's

We hold **158** at risk against Battr's **14** (2026-10-07). A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, so it cannot move on and it stays in this count every night. Each lead below is tested against its own list's at-risk window — a lead can match more than one line.

| Explanation | Leads | Share |
| --- | ---: | ---: |
| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | 71 | 45% |
| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | 55 | 35% |
| From `my +plus leads` or `Steve Hawks` — swept by choice, excluded by Battr | 46 | 29% |
| **None of the above** — Battr should be flagging these too | **28** | 18% |

**46 of 158** are expected differences — the two sources you chose to sweep. **112** are not explained by a rule you set; that is the number that has to reach about Battr's before going live.

- Stage-change timestamps on **812**, timeframe-change timestamps on **8572**, of 49880 FUB records (`timeframeUpdated` 8572, `stageUpdated` 812).

| At-risk leads | Leads | Automated email in window | Divergent source |
| --- | ---: | ---: | ---: |
| Battr stamped them too (Battr agrees) | 0 | 0 (—) | 0 |
| Only we flag them | 158 | 71 (45%) | 46 |

If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.

| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |
| --- | ---: | ---: | ---: | ---: | ---: |
| Patty Cierley | 44 | 29 | 15 | 5 | 8 |
| Quetza Adame | 22 | 0 | 2 | 18 | 3 |
| Nik Sharapov | 19 | 7 | 8 | 2 | 5 |
| Shantele Marcum | 17 | 1 | 1 | 14 | 2 |
| Anthony Ma | 11 | 5 | 5 | 1 | 5 |
| Sylvia Landa | 9 | 8 | 7 | 0 | 0 |
| Kenny Chung | 6 | 2 | 2 | 1 | 2 |
| Nicole Miller | 6 | 5 | 5 | 3 | 0 |
| Lynda Hwang | 5 | 2 | 4 | 0 | 1 |
| Misty Sumner | 3 | 1 | 0 | 0 | 2 |
| Karen Lakes | 3 | 2 | 1 | 0 | 0 |
| Jason Shawver | 3 | 2 | 2 | 0 | 0 |

| Judged by list | Window | At risk |
| --- | ---: | ---: |
| 🌤️ Warm Back Up | 10d | 52 |
| 🌱 Monthly Nurture | 33d | 38 |
| 😎 Bi-Weekly Nurture | 16d | 35 |
| 🔥 Weekly Nurture | 10d | 23 |
| 👀 Quarterly Nurture | 93d | 6 |
| 🌶️ Hot Leads | 2d | 4 |

### At risk here, not flagged by Battr — 112 lead(s)

Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.

| FUB ID | Agent | List | Window | Stage | Source | Our last touch |
| ---: | --- | --- | ---: | --- | --- | --- |
| 99903 | Adin Roland | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | call out, 13.2d ago |
| 43933 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Nurture | Real Geeks | call out, 35.2d ago |
| 53263 | Anthony Ma | 🔥 Weekly Nurture | 10d | Nurture | Sign Calls/Mailers | timeframe change, 16.1d ago |
| 63218 | Anthony Ma | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | timeframe change, 23.3d ago |
| 86239 | Anthony Ma | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | call out, 37.1d ago |
| 99742 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | text in, 31.4d ago |
| 100441 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | Citywide Long Form | call out, 29.1d ago |
| 101417 | Anthony Ma | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 16.2d ago |
| 101552 | Anthony Ma | 🌤️ Warm Back Up | 10d | Lead | Google LSA | call out, 14.1d ago |
| 101572 | Anthony Ma | 🌤️ Warm Back Up | 10d | Lead | Direct Call | timeframe change, 12.1d ago |
| 101628 | Anthony Ma | 🌶️ Hot Leads | 2d | Attempted Contact | Zillow Preferred | call out, 7d ago |
| 86534 | Eric Graham | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | call out, 16.2d ago |
| 100413 | Jason Shawver | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | stage change, 22.8d ago |
| 100516 | Jason Shawver | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | text out, 23.4d ago |
| 101001 | Jason Shawver | 🌱 Monthly Nurture | 33d | Spoke with Customer | TheRolandTeam.com | call out, 33.3d ago |
| 36325 | Karen Lakes | 🔥 Weekly Nurture | 10d | Spoke with Customer | TheRolandTeam.com | call out, 18.3d ago |
| 81931 | Karen Lakes | 🔥 Weekly Nurture | 10d | Spoke with Customer | Zillow Preferred | stage change, 22.8d ago |
| 101104 | Karen Lakes | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | zbuyer.com | stage change, 16.8d ago |
| 34689 | Karen Valdivia | 🌱 Monthly Nurture | 33d | Nurture | Google PPC | timeframe change, 35.2d ago |
| 60089 | Karen Valdivia | 😎 Bi-Weekly Nurture | 16d | Nurture | Google PPC | call out, 35.4d ago |
| 101494 | Kate Frihse | 🌤️ Warm Back Up | 10d | Lead | Ylopo LSA | nothing in 100 days |
| 58732 | Kenny Chung | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow.com | call out, 17.1d ago |
| 88297 | Kenny Chung | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | call out, 17.1d ago |
| 100243 | Kenny Chung | 🌤️ Warm Back Up | 10d | Attempted Contact | TheRolandTeam.com | call out, 13.1d ago |
| 101633 | Kenny Chung | 🌶️ Hot Leads | 2d | Attempted Contact | Zillow Preferred | stage change, 3.8d ago |
| 101659 | Kenny Chung | 🌶️ Hot Leads | 2d | Lead | Zillow Preferred | timeframe change, 3.3d ago |
| 66928 | Lynda Hwang | 🌱 Monthly Nurture | 33d | Nurture | zBuyer | timeframe change, 227d ago |
| 80680 | Lynda Hwang | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | timeframe change, 20.3d ago |
| 86590 | Lynda Hwang | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | email out, 44.4d ago |
| 86612 | Lynda Hwang | 👀 Quarterly Nurture | 93d | Nurture | Zillow Preferred | timeframe change, 107.5d ago |
| 98328 | Lynda Hwang | 👀 Quarterly Nurture | 93d | Nurture | Zillow Preferred | timeframe change, 145.4d ago |
| 99626 | Martine Goldberg | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 29.3d ago |
| 100821 | Martine Goldberg | 🌱 Monthly Nurture | 33d | Nurture | Ylopo PPC+ | call out, 50.2d ago |
| 100253 | Misty Sumner | 🌤️ Warm Back Up | 10d | Attempted Contact | ISA Transfer | call out, 22.2d ago |
| 100812 | Misty Sumner | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | stage change, 33.8d ago |
| 101551 | Misty Sumner | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | timeframe change, 14.1d ago |
| 68903 | Nicole Miller | 👀 Quarterly Nurture | 93d | Spoke with Customer | zbuyer.com | timeframe change, 111.2d ago |
| 71425 | Nicole Miller | 👀 Quarterly Nurture | 93d | Nurture | CallAction  > Riders | timeframe change, 253.2d ago |
| 100191 | Nicole Miller | 🌱 Monthly Nurture | 33d | Spoke with Customer | TheRolandTeam.com | call out, 37.3d ago |
| 60344 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | Leadpops - Google Ads | email out, 39d ago |
| 60368 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | Google PPC | email out, 20d ago |
| 63217 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Nurture | ISA Transfer | email out, 50d ago |
| 73578 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | zbuyer.com | email out, 63d ago |
| 79957 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | text out, 34.2d ago |
| 82532 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | Zillow Preferred | text out, 16.2d ago |
| 82744 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Nurture | zbuyer.com | email out, 24d ago |
| 89293 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | email out, 53d ago |
| 89987 | Nik Sharapov | 🌱 Monthly Nurture | 33d | Spoke with Customer | Zillow Preferred | email out, 44d ago |
| 96046 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Nurture | Zillow | call out, 16.1d ago |
| 97306 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | email out, 23d ago |
| 99637 | Nik Sharapov | 😎 Bi-Weekly Nurture | 16d | Spoke with Customer | TheRolandTeam.com | call out, 34.2d ago |
| 100047 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Nurture | zbuyer.com | email out, 28d ago |
| 100936 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Attempted Contact | zbuyer.com | email out, 24d ago |
| 101301 | Nik Sharapov | 🔥 Weekly Nurture | 10d | Nurture | Zillow Preferred | email out, 20d ago |
| 101524 | Nik Sharapov | 🌤️ Warm Back Up | 10d | Lead | Ylopo LSA | nothing in 100 days |
| 101596 | Nik Sharapov | 🌶️ Hot Leads | 2d | Lead | Google LSA | text out, 9.3d ago |
| 35654 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | TheRolandTeam.com | text out, 39d ago |
| 37305 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | TheRolandTeam.com | text out, 46.2d ago |
| 48140 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | text out, 35d ago |
| 48247 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Bing PPC | text out, 37d ago |
| 50283 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | TheRolandTeam.com | call out, 19.4d ago |
| 58604 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Google PPC | text out, 39d ago |
| 63390 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | text out, 37d ago |
| 70858 | Patty Cierley | 🔥 Weekly Nurture | 10d | Spoke with Customer | ISA Transfer | stage change, 22.8d ago |
| 71402 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | zbuyer.com | call out, 37.3d ago |
| 74492 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | zbuyer.com | text out, 20.3d ago |
| 83567 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Zillow Preferred | call out, 34.1d ago |
| 89713 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | timeframe change, 43.4d ago |
| 89727 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Ylopo | text out, 51.5d ago |
| 97709 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | timeframe change, 63.3d ago |
| 98230 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Citywide Long Form | call out, 29.1d ago |
| 98274 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | TheRolandTeam.com | call out, 37.3d ago |
| 98445 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | call out, 19.4d ago |
| 99496 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | zbuyer.com | timeframe change, 38.3d ago |
| 99646 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Citywide Long Form | text out, 20.3d ago |
| 99650 | Patty Cierley | 😎 Bi-Weekly Nurture | 16d | Nurture | Ylopo | call out, 35.2d ago |
| 99712 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | Zillow Preferred | call out, 34.1d ago |
| 99778 | Patty Cierley | 🔥 Weekly Nurture | 10d | Spoke with Customer | ISA Transfer | stage change, 14.8d ago |
| 99802 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | TheRolandTeam.com | stage change, 36.4d ago |
| 99875 | Patty Cierley | 🌱 Monthly Nurture | 33d | Nurture | TheRolandTeam.com | call out, 40.2d ago |
| … | 32 more | | | | | |

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Patty Cierley | 133 | 44 | 2 | 0 |
| Quetza Adame | 36 | 22 | 0 | 0 |
| Nik Sharapov | 76 | 19 | 1 | 0 |
| Shantele Marcum | 31 | 17 | 0 | 0 |
| Anthony Ma | 46 | 11 | 1 | 0 |
| Sylvia Landa | 30 | 9 | 3 | 0 |
| Kenny Chung | 112 | 6 | 0 | 0 |
| Lynda Hwang | 24 | 5 | 1 | 0 |
| Nicole Miller | 11 | 6 | 0 | 0 |
| Martine Goldberg | 9 | 3 | 1 | 0 |
| Karen Lakes | 7 | 3 | 1 | 0 |
| Jason Shawver | 20 | 3 | 0 | 0 |
| Misty Sumner | 16 | 3 | 0 | 0 |
| Karen Valdivia | 11 | 2 | 1 | 0 |
| Kate Frihse | 3 | 1 | 1 | 0 |
| Eric Graham | 323 | 1 | 0 | 0 |
| Resty Valdeleon | 44 | 1 | 0 | 0 |
| Liza Rivera | 3 | 1 | 0 | 0 |
| Adin Roland | 2 | 1 | 0 | 0 |
| Jamie Zahorobsky | 1 | 0 | 0 | 0 |

## Inbound, never answered (48)

These leads called or texted us and nobody has called or texted back since.
They are not swept for it — an inbound contact counts as a touch — but this is the list to work.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| Rebecca Turner | Sylvia Landa | 79 | Realtor.com |
| Jasmine Lopez | Martine Goldberg | 76 | Google PPC |
| Sharon Swift | Kenny Chung | 68 | Google PPC |
| Ken Benson | Kenny Chung | 63 | Realtor.com |
| Donald Davil Lockwood | Sylvia Landa | 62 | TheRolandTeam.com |
| Pamela Cyrnek | Patty Cierley | 58 | TheRolandTeam.com |
| Henry Makekau | Misty Sumner | 48 | Jeffery Dragovich |
| Melanie Isbell | Patty Cierley | 47 | Noah Cash Offer |
| Joseph Talamo | Patty Cierley | 47 | TheRolandTeam.com |
| Norma Holloway | Kenny Chung | 46 | Inbound Call |
| Renees Mendoza | Eric Graham | 42 | Google PPC |
| Philip Rossovich | Patty Cierley | 41 | zbuyer.com |
| Lois Centeno | Kenny Chung | 41 | Ylopo |
| Omar & Eylin Falbi | Anthony Ma | 39 | Jeffery Dragovich |
| Paul | Kate Frihse | 38 | Direct Traffic |
| Hasham Hanid | Sylvia Landa | 37 | Ylopo PPC+ |
| Pam Hunter | Misty Sumner | 36 | Zillow Preferred |
| Diane Bloecker | Eric Graham | 36 | Google PPC |
| Dashawn Williams | Kenny Chung | 35 | Zillow Preferred |
| Angela Nickels | Misty Sumner | 33 | Zillow |
| Carol Bailey | Patty Cierley | 33 | zbuyer.com |
| Melissa Whitmire | Anthony Ma | 31 | TheRolandTeam.com |
| Kelly Gafford | Eric Graham | 28 | Google PPC |
| Hugh McClimans | Liza Rivera | 28 | Citywide Long Form |
| Kenneth Riley | Misty Sumner | 25 | Zillow Preferred |
| CYROUS MOFAZELI | Jason Shawver | 23 | Zillow Preferred |
| Edwin Morales | Patty Cierley | 23 | Zillow Preferred |
| Chris Bennett | Sylvia Landa | 23 | Company |
| Xavier Olson | Jason Shawver | 22 | Zillow Preferred |
| Noelle Tillery | Patty Cierley | 19 | Zillow Preferred |
| Amanda Smith | Anthony Ma | 17 | Zillow Preferred |
| Jordan | Shantele Marcum | 14 | Direct Call |
| Miranda Lam | Shantele Marcum | 13 | zbuyer.com |
| Nick (Amir) Quintero | Nik Sharapov | 9 | ISA Transfer |
| Jikai | Resty Valdeleon | 9 | Zillow Preferred |
| Mary Davis | Nik Sharapov | 8 | TheRolandTeam.com |
| Janice Wilson | Kenny Chung | 8 | Zillow.com |
| Riley Page | Kenny Chung | 7 | Zillow Preferred |
| Devon Downs | Sylvia Landa | 6 | Zillow Preferred |
| Michael Zahn | Anthony Ma | 6 | Zillow Preferred |
| Craig Kiernan | Resty Valdeleon | 6 | ReferralExchange |
| Rick Graham | Shantele Marcum | 6 | Google PPC |
| Steve C | Patty Cierley | 6 | Zillow Preferred |
| Sharon Johnson | Patty Cierley | 5 | Zillow Preferred |
| Lorena Sanchez | Patty Cierley | 5 | Zillow Preferred |
| Adam Hernandaz | Kenny Chung | 4 | zbuyer.com |
| Laura Reeves | Jason Shawver | 4 | Zillow Preferred |
| Argentina Melchiir | Patty Cierley | 2 | Zillow Preferred |

## By lead source

| Source | Bucket | At risk | Neglected |
| --- | --- | ---: | ---: |
| my +plus leads | Portals & aggregators | 44 | 0 |
| Zillow Preferred | Zillow | 40 | 3 |
| zbuyer.com | Zillow | 15 | 0 |
| TheRolandTeam.com | Website & organic | 14 | 0 |
| Ylopo | Portals & aggregators | 11 | 2 |
| Google PPC | Paid search & social | 5 | 1 |
| ISA Transfer | Team & internal | 4 | 2 |
| Citywide Long Form | Portals & aggregators | 3 | 1 |
| Ylopo LSA | Portals & aggregators | 3 | 0 |
| Ylopo PPC+ | Portals & aggregators | 2 | 1 |
| Google LSA | Paid search & social | 2 | 0 |
| Direct Call | Team & internal | 2 | 0 |
| Steve Hawks | Team & internal | 2 | 0 |
| Sign Calls/Mailers | Signs & mailers | 1 | 0 |
| Zillow | Zillow | 1 | 0 |
| YouTube | Paid search & social | 1 | 0 |
| Real Geeks | Portals & aggregators | 1 | 0 |
| Zillow.com | Zillow | 1 | 0 |
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
| 🏹 Zillow Important | 121 | 44 | (+175.0%) | 2026-09-03 ⚠ 69d older |
| ❗Active Leads | 0 | 131 | (-100.0%) | 2026-09-03 ⚠ 69d older |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2106 | 4198 | (-49.8%) | 2026-09-03 ⚠ 69d older |
| 🎤 AI TEXT REPLIES | 7 | 10 | (-30.0%) | 2026-09-03 ⚠ 69d older |
| ⭐️ Team Leads (combined) | 938 | 767 | (+22.3%) | 2026-10-07 ⚠ 35d older |
| 📖 Current & Upcoming Clients | 521 | 451 | (+15.5%) | 2026-09-03 ⚠ 69d older |
| ‼️ YLOPO IMPORTANT | 108 | 116 | (-6.9%) | 2026-09-03 ⚠ 69d older |
| 💛 Sphere & Past Clients | 3316 | 3332 | (-0.5%) | 2026-09-03 ⚠ 69d older |

> **8 of 8 rows compare against a Battr count from a different day**, shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a drift figure spanning several days is measuring that movement, not a disagreement with us. Transcribe the current night before trusting a bracketed number.

Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no export — so a stale date in the last column means nobody has transcribed lately, not that Battr stopped changing. `battr-logs/comparison.csv` is the file to add them to.

## Reconciliation — other lists Battr runs (reported, never actioned)

| List | Ours | Battr 2026-09-02 | Ours: C / AR / N | Battr: C / AR / N |
| --- | ---: | ---: | --- | --- |
| 🗓️ CLEAN UP: Nurtures No Timeframe | 2106 | 4200 | 214 / 123 / 1769 | 211 / 129 / 3860 |
| 💛 Sphere & Past Clients | 3316 | 3332 | 216 / 5 / 3095 | 356 / 2 / 2974 |
| ‼️ YLOPO IMPORTANT | 108 | 116 | 30 / 40 / 38 | 64 / 8 / 44 |
| 🏹 Zillow Important | 121 | 44 | 16 / 12 / 93 | 16 / 2 / 26 |
| 📖 Current & Upcoming Clients | 521 | 451 | 144 / 5 / 372 | 176 / 4 / 271 |
| 🎤 AI TEXT REPLIES | 7 | 10 | 5 / 2 / 0 | 8 / 0 / 2 |
| ❗Active Leads | 0 | 131 | 0 / 0 / 0 | 67 / 18 / 46 |

⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.

**Still unmodelled:**
- 📊 Database Health Score — 20,099 records on 2026-09-02. A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.

## At Bats — last 180 days

| Agent | At bats | Pond claims | Converted | Conversion | Retention |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kate Frihse | 41 | 0 | 2 | 4.9% | 34.1% |
| Mike Roland | 544 | 0 | 21 | 3.9% | 30.9% |
| Quetza Adame | 37 | 0 | 1 | 2.7% | 86.5% |
| Misty Sumner | 43 | 0 | 1 | 2.3% | 67.4% |
| Sylvia Landa | 65 | 0 | 1 | 1.5% | 81.5% |
| Nik Sharapov | 112 | 0 | 1 | 0.9% | 95.5% |
| Resty Valdeleon | 279 | 0 | 1 | 0.4% | 79.6% |
| Adin Roland | 3535 | 0 | 12 | 0.3% | 91.3% |
| Kenny Chung | 156 | 0 | 0 | 0.0% | 85.3% |
| Patty Cierley | 123 | 0 | 0 | 0.0% | 96.7% |
| Eric Graham | 72 | 0 | 0 | 0.0% | 94.4% |
| User 121 | 51 | 0 | 0 | 0.0% | 0.0% |
| Anthony Ma | 39 | 0 | 0 | 0.0% | 94.9% |
| Shantele Marcum | 38 | 0 | 0 | 0.0% | 94.7% |
| Karen Valdivia | 26 | 0 | 0 | 0.0% | 80.8% |
| Jason Shawver | 23 | 0 | 0 | 0.0% | 78.3% |
| Martine Goldberg | 15 | 0 | 0 | 0.0% | 100.0% |
| User 73 | 12 | 0 | 0 | 0.0% | 0.0% |
| Lynda Hwang | 5 | 0 | 0 | 0.0% | 100.0% |
| Nicole Miller | 4 | 0 | 0 | 0.0% | 100.0% |
| User 65 | 4 | 0 | 0 | 0.0% | 0.0% |
| Karen Lakes | 2 | 0 | 0 | 0.0% | 100.0% |
| Liza Rivera | 1 | 0 | 0 | 0.0% | 100.0% |
| Jamie Zahorobsky | 1 | 0 | 0 | 0.0% | 100.0% |

---
Ponds available: Brett Pond, Shark Tank, Money Time, Spanish-Speaking Leads, Missed Opportunities 😭, Upnest 🪺. Undo this run: `node scripts/battr-audit.mjs --undo=2026-11-11-gzlb`