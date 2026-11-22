# Battr cutover — Battr is cancelled; this engine is the only audit

Battr's last run was 9 Oct 2026 and the subscription is cancelled (Mike, 17 Nov).
**LIVE as of 22 Nov 2026 (Mike: "Yes, go live tonight").** Nudges write; sweeping is
paused. Until then every nightly run was a dry run, so agents had not been warned for
six weeks.

## Why existing Battr stamps are still honoured
- This engine reads and writes the same stamp, `Battr At Risk Since`. A lead
  Battr warned before it ended is already on the clock and is swept on the same
  schedule (3 days after the stamp, 2 for Hot Leads, Tue–Fri, never Monday).

## 1. Where things stand (22 Nov 2026)

The first live night (18 Nov) flagged **1,063** leads against Battr's last recorded **14**, because
Follow Up Boss will not serve texts or emails in bulk and the audit read a lead an agent had only
texted as never contacted. It was fixed (per-person check) and held in dry run until 22 Nov, when
Mike turned nudging live:

- `rules.forceDryRun: false` — nudges write when the `BATTR_LIVE` repo variable is `true`.
  The kill switch is still in the code: set `forceDryRun: true` (PR) or the `BATTR_FORCE_DRY_RUN=true`
  env hook, and `BATTR_LIVE=true` still produces a dry run. Only `undo` can write.
- `rules.profile: "battr"` — Battr's six lists and thresholds exactly (see `docs/battr-rules.md`).
  The 17 Nov stage rules are kept behind `"extended"`.
- `rules.sweepsStartOn: "2027-01-01"` — the 20 Nov sweep start is paused.
- **Pass 2 contact check** — every at-risk or neglected candidate has its texts AND emails read
  person by person; a lead with an agent touch in the window drops off; a lead that cannot be read
  is held as **unverified** and listed. One unreadable lead no longer holds the night.
- **Hard caps.** *Nudges* work the backlog down in batches (Mike, 22 Nov 2026, "warn the 50 most
  overdue each night"): 50 a night, at most 10 per agent, most overdue first (days past the
  lead's own at-risk line). A lead already warned drops off, so the next night is the next 50.
  The ~150 leads past their line on 19 Nov take about 4-5 nights. Only a night over
  `maxNudgeBacklog` (400) is a fault: nothing is done and the list is emailed to
  mike@therolandteam.com (18 Nov's 1,063 was that). *Sweeps* keep the strict rule: over 50
  eligible, nothing moves and Mike is emailed the list.
- **Nightly email to Mike** (a dry run still sends it): tonight at a glance, our count beside
  Battr's last recorded one (with its age), the would-be nudges and sweeps, the unverified leads, and
  every flagged lead with the rule that fired.

## 2. Go-live criteria (the original bar, for the record)

Three nights in a row of: our verified at-risk count near Battr's rate (14 of 805, about 1.7%, last
recorded 7 Oct — there is no newer number); every flagged lead with a rule that holds up against
`docs/battr-rules.md`; few unverified leads, each with a stated reason; no cap tripped.
Mike chose to go live on 22 Nov with the 50-a-night batch cap as the safeguard instead.

Still open: `rules.sweepsStartOn` (paused, 2027-01-01 — un-pause once the backlog is warned),
the stage-move rule (any stage change counts as work for now), and whether to switch
`rules.profile` to `"extended"`.

## 3. First live night — what to expect
- Nudges (note + stamp) on the **50 most overdue** at-risk leads, at most 10 per agent; the rest
  wait and are not listed in tonight's agent emails. About 4-5 nights to clear the backlog.
- **Nothing is swept** (paused). Agent emails say sweeping starts "on a date to be announced".
- Sweeps, once on, are capped at 30 per run and 25 per pond.
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
