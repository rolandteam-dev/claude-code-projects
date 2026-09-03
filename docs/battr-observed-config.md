# What Battr actually shows — observed, not inferred

Everything in `scripts/battr/lists.mjs` was reconstructed from six weeks of
Battr's audit *emails*, because the app was unreachable from the build
environment. This file records what the app itself shows, so the two can be
reconciled before we go live. **Where this file and the emails disagree, this
file wins.**

## Source

Aida Audits screen, `app.battr.ai/aida/audits?date=2026-09-02`, scope
"The Roland Team", all scheduled. **15 audits that day**; 9 visible in the
capture.

## Observed, 2 September 2026

Compliance bars read green / blue / red = compliant / at risk / neglected.

| Run time (PT) | List | Type | Records | Compliant | At risk | Neglected |
|---|---|---|---:|---:|---:|---:|
| 7:05:35 PM | 📊 Database Health Score | Combined, 13 sources | 20,099 | 1,773 (9%) | 10,577 (53%) | 7,749 (39%) |
| 7:00:30 PM | ⭐️ Team Leads (Nudges & Sweeps) | Combined, **6 sources** | **866** | 842 (97%) | **17 (2%)** | **7 (1%)** |
| 6:55:34 PM | 🌤️ Warm Back Up | Contact | **10,783** | 108 (1%) | 10,120 (94%) | 555 (5%) |
| 6:55:31 PM | 🗓️ CLEAN UP: Nurtures No Timeframe | Contact | **4,200** | 211 (5%) | 129 (3%) | **3,860 (92%)** |
| 6:55:21 PM | 💛 Sphere & Past Clients | Contact | 3,333 | 356 (11%) | 2 (0%) | 2,975 (89%) |
| 6:55:18 PM | ❗Active Leads | Contact | 135 | 65 (48%) | 21 (16%) | 49 (36%) |
| 6:55:15 PM | 🎤 AI TEXT REPLIES | Contact | 9 | 7 (78%) | 0 (0%) | 2 (22%) |
| 6:55:15 PM | ‼️ YLOPO IMPORTANT | Contact | 127 | 74 (58%) | 7 (6%) | 46 (36%) |
| 6:55:15 PM | 🏹 Zillow Important | Contact | 43 | 14 (33%) | 5 (12%) | 24 (56%) |

Six further audits are below the fold and not yet captured.

## What this confirms

- **Run time.** Member lists at ~6:55 PM, combined lists at 7:00–7:05 PM. Our
  02:00 UTC / 7:00 PM PT schedule is right.
- **Audit list size.** Team Leads at 866 records sits inside the 840–892 range
  the emails implied.
- **Daily volume.** 17 at risk and 7 neglected on this date, consistent with the
  ~10 notes / ~8 sweeps a day the emails showed.
- **Compliance model.** Three states, exactly as built.

## What this contradicts — open, and blocking

### 1. Team Leads holds 866 records. Warm Back Up alone holds 10,783.

Warm Back Up is one of the six member lists, and on its own it is **twelve times
the size of the combined list it feeds**. Our model unions the member lists and
then applies two exclusions (lead bucket 82, owner group 52555), which cannot
account for a 92% reduction — and the audit emails reported both exclusion
counts as **0**.

So the combined list is doing something our model does not. Possibilities, in
rough order of likelihood:

- the six sources feeding Team Leads are **not** the six lists we assumed;
- the combined list carries its own conditions beyond the two exclusions;
- membership is an intersection or a priority order rather than a union.

**This is the one number that decides sweep volume.** If we union what we think
the members are, the audit population is an order of magnitude larger than
Battr's, and so is everything downstream of it.

**Needed:** the *View source counts (6)* dropdown on the Team Leads row — it
names the six member lists and how many records each contributes.

### 2. Battr already has a no-timeframe cleanup list, and it is enormous.

🗓️ **CLEAN UP: Nurtures No Timeframe — 4,200 records, 92% neglected.**

This answers the question directly: **4,200 nurture leads have no timeframe.**
Our list 1145 was built for exactly this population, independently, so the model
is right — but it is a *contact* list here, run separately, and whether it feeds
Team Leads is unknown (it is one candidate for the six).

Its thresholds are also unknown. 92% neglected against 3% at risk suggests a
short one, or a rule that reads "no timeframe" as neglect on its own.

**Needed:** the list's rule screen — the at-risk and neglected day counts.

### 3. There are lists we have never modeled.

💛 Sphere & Past Clients (3,333), 🎤 AI TEXT REPLIES (9), ‼️ YLOPO IMPORTANT
(127), 🏹 Zillow Important (43), 📊 Database Health Score (combined, 13
sources), plus six more below the fold.

Most are almost certainly reporting-only — Sphere & Past Clients at 89%
neglected would be a catastrophe if it swept, and those sources are on our
protected list. But "almost certainly" is not a basis for going live.

**Needed:** for each list, whether it carries actions, and which of them feed a
combined list that does.

## Reconciliation test before going live

Run the audit in dry mode and compare against a same-day Battr audit:

| Check | Battr, 2 Sep 2026 | Ours | Pass? |
|---|---:|---|---|
| Team Leads population | 866 | | within ±10% |
| At risk | 17 | | within ±5 |
| Neglected | 7 | | within ±3 |
| Nurtures with no timeframe | 4,200 | | within ±10% |

The last row can be checked today with `npm run battr:census` — it counts the
same population from Follow Up Boss directly, and it is the one row that needs
no Battr access at all.

If the population row is out by an order of magnitude, the fix is in the
combined list's membership rule, not in the thresholds.
