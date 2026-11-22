# Battr cutover — Battr is cancelled; this engine is the only audit

Battr's last run was 9 Oct 2026 and the subscription is cancelled (Mike, 17 Nov).
Since then every nightly run has been a **dry run**: nothing has been nudged,
swept or emailed. Going live is no longer a handover — it restores the warnings
agents have not had for five weeks.

## Why existing Battr stamps are still honoured
- This engine reads and writes the same stamp, `Battr At Risk Since`. A lead
  Battr warned before it ended is already on the clock and is swept on the same
  schedule (3 days after the stamp, 2 for Hot Leads, Tue–Fri, never Monday).

## 1. Where things stand (19 Nov 2026)

The first live night (18 Nov) flagged **1,063** leads against Battr's last recorded **14**, because
Follow Up Boss will not serve texts or emails in bulk and the audit read a lead an agent had only
texted as never contacted. It held every nudge and sent nothing. So the audit is **back in dry run**:

- `rules.forceDryRun: true` — in code; `BATTR_LIVE=true` and a manual "live" run both still produce a
  dry run. Only `undo` can write. Turning it live means editing that one line, deliberately.
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

## 2. What has to be true before it goes live

Three nights **in a row** where all of these hold:
- [ ] Our verified at-risk count is close to Battr's rate. Battr's last recorded night was 14 of 805
      audited (about 1.7%); there is no newer Battr number, because Battr was cancelled.
- [ ] Every lead we flag has a real reason: the rule that fired is in the report, and it holds up
      against `docs/battr-rules.md`.
- [ ] Unverified leads are few and each has a stated reason (a failed lookup, not a pattern).
- [ ] No cap tripped. (A tripped cap is the audit telling us the evidence is wrong.)

Then, and only then, Mike says go, and:
1. `rules.forceDryRun` → `false` (a PR Claude opens on his word).
2. `rules.sweepsStartOn` → the date sweeping should begin.
3. `BATTR_LIVE` → `true` (already set) — the nightly job writes.
4. Decide whether to switch `rules.profile` to `"extended"` (the 17 Nov stage rules).

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
