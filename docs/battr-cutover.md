# Battr cutover — go live Thursday 8 Oct 2026

Battr ends 8 Oct (Mike, 6 Oct). Our audit takes over with **Thursday's 7 PM PT run**.
Authorized by Mike on 6 Oct: "Yes, go live Thursday." Both switches below stay OFF
until the gate in step 1 is met.

## Why the handover is seamless
- Battr and this engine share one stamp, `Battr At Risk Since`. Every lead Battr
  already warned (27 on 5 Oct) is already on the clock; we sweep it on Battr's
  schedule (3 days after the stamp, 2 for Hot Leads, Tue–Fri, never Monday).
- If both run on Thursday night, nothing doubles: Battr goes first (7 PM), and our
  run sees its stamps ("already flagged") and its sweeps (already moved).

## 1. The gate (before either switch)
- [ ] Single-lead dry run for **#38253** (Actions → Battr audit → task `audit`,
      mode `dry`, stage `at-risk`, only_id `38253`) — banner shows the lead qualifies.
- [ ] Single-lead **live** run, same inputs with mode `live` — one note + the stamp on
      #38253 in Follow Up Boss, no agent emailed, nothing else touched.
- [ ] Undo it (task `undo`, the run id from the report banner) — note gone, stamp clear.
- [ ] Battr's Tuesday 6 Oct Neglected email matches our prediction (13 leads).

## 2. The switches (Thursday, before 7 PM PT)
1. **`rules.sweepOnBackfilledTexts: true`** in `scripts/battr/rules.mjs` (Claude opens
   the PR once step 1 is met). In a dry run this only changes the report from "held"
   to "would act" — it writes nothing.
2. **`BATTR_LIVE` = `true`** (GitHub → Settings → Secrets and variables → Actions →
   Variables). This is what makes the scheduled run write. Only Mike sets it.

## 3. First live night — what to expect
- Nudges (note + stamp) on every at-risk lead Battr has not already stamped, including
  the two sources swept by choice (`my +plus leads`, `Steve Hawks`) — about 45 on the
  5 Oct numbers, so the first night's At Risk email will look bigger than Battr's.
- Sweeps are capped at 30 per run and 25 per pond; extra leads wait for the next night.
- Agents get their per-agent emails (`BATTR_ALERT_CHANNEL`, default email).

## 4. Brake
- Stop writing: set `BATTR_LIVE` to anything but `true`. The next run is a dry run.
- Reverse a night: Actions → Battr audit → task `undo` with the run id at the bottom
  of that run's report. It puts swept leads back with their owner and removes nudges
  from single-lead tests. It refuses a dry run's log.

## 5. After cutover
- Keep the nightly comparison rows; stop expecting a Battr row once the subscription ends.
- Import Gabby's At Bats export (`node scripts/battr/import-atbats.mjs --dry`, then for
  real) so the At Bats history is complete.
