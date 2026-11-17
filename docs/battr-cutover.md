# Battr cutover — Battr is cancelled; this engine is the only audit

Battr's last run was 9 Oct 2026 and the subscription is cancelled (Mike, 17 Nov).
Since then every nightly run has been a **dry run**: nothing has been nudged,
swept or emailed. Going live is no longer a handover — it restores the warnings
agents have not had for five weeks.

## Why existing Battr stamps are still honoured
- This engine reads and writes the same stamp, `Battr At Risk Since`. A lead
  Battr warned before it ended is already on the clock and is swept on the same
  schedule (3 days after the stamp, 2 for Hot Leads, Tue–Fri, never Monday).

## 1. The gate (before either switch)
- [x] Single-lead dry run on **#85008** (8 Oct, run `2026-10-08-mtap`) — qualifies.
- [x] Single-lead **live** run on #85008 (run `2026-10-08-wmio`) — one note + the
      stamp, no agent emailed, nothing else touched. It exposed "undefined days"
      in the note text (fixed in #151).
- [x] Undo of that run (run #59) — note gone, stamp clear, verified in FUB.
- [ ] **Second single-lead live run + undo** on the fixed code — the note must read
      "N days with no outreach" with a real number.
- [ ] **Sending domain:** repo variable `BATTR_REPORT_FROM` is an address on a
      Resend-verified domain (not `onboarding@resend.dev`, which only delivers to
      the account owner). Without it every agent email is refused.
- [ ] Mike's decision on the stage-move rule (forward moves only vs. as is).

## 2. The switches
1. **`rules.sweepOnBackfilledTexts: true`** — DONE 17 Nov 2026 (Mike: "my leads are
   being neglected, start sweeping, with the ability to undo"). The second
   single-lead test and the stage-move decision were not waited for; stage moves
   count as work exactly as they do today (change later if wanted).
2. **First live run, by hand:** Actions → Battr audit → Run workflow → branch `main`,
   task `audit`, **mode `live`**, stage `both`, only_id **empty**. A manual live run
   writes without the repo variable, so the first night can be watched.
3. **`BATTR_LIVE` = `true`** (Settings → Secrets and variables → Actions → Variables)
   makes the *scheduled* nightly run write. Only Mike sets it, after the first run
   looks right.

## 3. First live night — what to expect
- Nudges (note + stamp) on every at-risk lead not already stamped, including the two
  sources swept by choice (`my +plus leads`, `Steve Hawks`) — about 166 on the 16 Nov
  dry run, because nothing has been warned since 9 Oct. Expect a big first night:
  one email per agent (not one per lead), and the agents' lists will be long.
- Sweeps are capped at 30 per run and 25 per pond; extra leads wait for the next night.
- Agents get their per-agent emails (`BATTR_ALERT_CHANNEL`, default email).

## 4. Brake
- Stop writing: set `BATTR_LIVE` to anything but `true`. The next run is a dry run.
- Reverse a night: Actions → Battr audit → task `undo` with the run id at the bottom
  of that run's report. It puts swept leads back with their owner and deletes that
  run's nudge notes and stamps (every nudge is now recorded, not just a single-lead
  test's). It refuses a dry run's log.

## 5. After cutover
- Keep the nightly comparison rows; stop expecting a Battr row once the subscription ends.
- Import Gabby's At Bats export (`node scripts/battr/import-atbats.mjs --dry`, then for
  real) so the At Bats history is complete.
