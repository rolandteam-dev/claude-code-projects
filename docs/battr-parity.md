# Battr Parity Audit

**The Roland Team · Internal Battr · rev 6 · 16 September 2026**

Readable version: https://claude.ai/code/artifact/9ea11959-2997-4c87-a980-643adb3d8f08

Seven of Battr's own audit nights, one census of the live database, its fifteen
rule screens, and a nightly dry run of our own.

| | |
|---|---|
| Audits modelled | **14 of 15.** Only Database Health Score, a roll-up over 13 unknown lists, has no rule. |
| On the big list | **0.3%** — CLEAN UP, ours 4,213 against Battr's 4,200, on the live database. |
| Blocking gaps | **3.** One needs a screen, one a probe, one a DNS record. None needs code. |
| Automated checks | **180**, run before every audit. If they fail, the audit does not run. |

## Verdict — the engine is right, three things outside it are not

Every gap that was about our code has closed. The population matches, the rules
are Battr's own rather than ours reverse-engineered, and the sweeping path is
stricter than it was. What is left is a rule screen nobody has opened, a probe
nobody has run, a domain nobody has verified — and one behaviour we can prove is
wrong but cannot yet fix.

| Measured | Ours | Battr | Verdict |
|---|---:|---:|---|
| Leads audited | 909 | 858 | within 6% |
| 🗓️ CLEAN UP | 4,213 | 4,200 | **0.3%** |
| 🌶️ Hot Leads | 19 | 19 | exact |
| 🌤️ Warm Back Up | 10,514 | 10,783 | −2.5% |
| Funnel kept | 6.8% | 7.1% | confirmed |

From the 14 September run, the first that completed. Its neglected count was
wrong — 392 against Battr's handful — for a reason since fixed.

> **The one behaviour we know is wrong.** On 15 September Battr swept 19 leads:
> **18 to Shark Tank and one to Money Time.** Nineteen is well below the 25 at
> which our model overflows, so under our rule all nineteen go to Shark Tank.
> The split is **not by count** — the rule is wrong in kind, and no value of 25
> fixes it. Not the owner, not the source; both checked against that night's rows.
>
> Left unchanged deliberately: pond routing is only ever edited from Battr's own
> rule screen, and assignment rule set 41 has not been read. One lead in the
> wrong pond on a night like that; twenty on a 45-sweep Tuesday.

## Evidence — seven of Battr's own nights

| Date | Day | In audit | At risk | Neglected | What it established |
|---|---|---:|---:|---:|---|
| 2 Sep | Wed | 866 | 17 | 7 | The source counts, and the 92.8% shed |
| 8 Sep | Tue | 903 | 23 | 45 | Exclusion counters are action-time |
| 10 Sep | Thu | 862 | 20 | 4 | The list self-drains; the interlock across days |
| 11 Sep | Fri | 861 | 24 | 3 | The three-day spread, measured |
| 12 Sep | Sat | 856 | 19 | — | A lead ages out of at-risk; no weekend sweeps |
| 13 Sep | Sun | 858 | 21 | — | The stamp survives a compliant excursion |
| 15 Sep | Tue | 880 | 23 | 19 | Forecast held at 19 v 22; Money Time appears |

Three of those changed the model:

- **A lead leaves the at-risk tier by ageing, not by being swept.** On Saturday
  the whole cohort flagged three days earlier left the list, on a night nothing
  could be swept. At Risk and Neglected are exclusive states on a clock; the
  sweep is an action taken on the second, not the thing that produces it.
- **The interlock asks "ever warned", not "recently warned."** A lead read
  *Previous Status: compliant, At Risk Since 9/07* and got no new note. The stamp
  is never cleared. On 15 Sep one such lead was warned, rescued by its agent, and
  swept anyway — with no second warning.
- **The forecast held.** Three days out, from cohort dates alone, we predicted
  Tuesday's backlog at 22 as an upper bound. Battr swept 19, and the stamps broke
  down exactly as the cohorts predicted: 3, 5, 5, 6.

## Rules — six we had wrong, corrected from Battr's screens

| List | What we had | What it is |
|---|---|---|
| ‼️ YLOPO IMPORTANT | source matches Ylopo, 7/10 | five intent tags, 30/60 |
| 🏹 Zillow Important | source matches Zillow, 5/8 | high-intent tags, not live-business, site activity <14d, 5/8 |
| 💛 Sphere & Past Clients | five lead sources, 90/93 | stage Sphere or Closed, 93/96 |
| 📖 Current & Upcoming | four stages that do not exist, 14/30 | seven live-business stages, 10/13 |
| ❗Active Leads | early pipeline + nurture | five named stages, no Nurture, into closed business |
| 🎤 AI TEXT REPLIES | unmodelled gap | two AI tags, 30/60, list 1150 |

> **Two were the wrong kind of list entirely.** YLOPO and Zillow Important were
> **source** lists in our model and **tag** lists in Battr's. A source records
> where a lead came from once; an intent tag is set when the lead does something
> now. We were reporting on every lead Ylopo ever sent — 2,389 — instead of the
> 127 currently raising a hand. The counts were close enough in shape not to look
> wrong, which is why a guess that reconciles is not a guess that is correct.

**The interlock, restored where Battr keeps it.** Every nurture list and Warm
Back Up have a Neglected tier of `Last Communication > N AND At Risk Notified Is
Not Empty`; ours carried only the first half. Adding a term to a conjunction can
only remove leads from the tier, so this narrowed the sweep and could not widen
it.

## Behaviour — capability by capability

| Behaviour | Battr | Ours | State |
|---|---|---|---|
| Run schedule | 7:08 PM PT, reliably | 02:00 UTC, delayed hours by GitHub | differs |
| The six member lists | source-counts dropdown | same six, same thresholds | confirmed |
| Combined-list shedding | keeps 7.1% | keeps 6.8% | confirmed |
| Timeframe bands | four nurture lists | resolved from `timeframeId` via FUB's table | confirmed |
| Day filters | nudge daily, sweep Tue–Fri | same — both weekend nights | confirmed |
| Warn-first interlock | in the rule and at action time | same, both places | confirmed |
| Idempotency | keys on the stamp existing | same — presence test, write when absent | confirmed |
| Last touch | calls and texts | calls in bulk, texts per person | confirmed |
| Exclusions | counters are action-time | done in the list filters | confirmed |
| Owner-group exclusion | "Battr Paused" FUB team | cannot fire — FUB returns no group ids | **gap** |
| Pond routing | assignment rule set 41 | count-based overflow — **refuted** | **gap** |
| Reply reprieve | not a Battr feature | built, inert — no row carries direction | **gap (ours)** |
| 📊 Database Health Score | 13 sources, 20,099 records | not modelled | **gap** |
| Undo | none | a workflow task; refuses a dry run's log | ours only |
| Per-agent scoreboard | per-lead wall of text | worst-first, plus unanswered inbound | ours only |
| Running comparison | — | `comparison.csv`, drift worst-first | ours only |

## Gaps — what is left, and who can close it

| Gap | Costs | Closed by |
|---|---|---|
| Pond routing | One lead in the wrong pond on a small night; twenty on a heavy Tuesday. | **Mike** — the assignment rule set 41 screen. |
| The reply reprieve is inert | A lead who wrote back by email can still be swept. Fails in the wrong direction. | **Mike** — one `inspect-fub-fields` run. |
| Sending domain unverified | Thirty agents get "your leads are being taken" from `onboarding@resend.dev`. | **Mike** — verify therolandteam.com in Resend. |
| Interlock unverified live | Fails safe, but if the stamp cannot be read no lead can ever be swept. | The nightly run now counts stamped contacts and calls zero a read failure. |
| Owner-group exclusion | Group 52555 excludes nobody. Someone could rely on it. | Nothing — worked around by name; the report says so above the counts. |
| 📊 Database Health Score | Reporting completeness only. It cannot act. | **Mike** — its rule screen, if worth modelling at all. |
| Run time | Our report lands hours after Battr's. | Nothing clean. GitHub's scheduler is best-effort. |

## Proof — how this is known to be true

The characteristic failure here is not a crash. It is a rule that quietly does
nothing while the run looks healthy. It has happened eleven times. Every fix
added the guard, not only the patch — and three guards have since caught a real
defect on their first run.

- **No list is silently empty.** Each of the twelve lists gets a contact built to
  fall inside it. It caught the corrected Sphere rule the moment the fixture
  stopped matching.
- **The list ids cannot be transposed.** Hot Leads and Warm Back Up are
  near-mirrors on 2/4 and 10/13; swap them and ten thousand leads inherit a
  four-day sweep line. Five checks pin it; one caught a rename left half-done.
- **A partial backfill can never read as complete.** One lead's thread failing
  makes the whole pass incomplete — a lead we could not read is
  indistinguishable from a lead with no texts.
- **The undo refuses a dry run's log.** Reversing sweeps that never happened
  would assign live leads to owners they were never taken from.
- **A zero that should be impossible is called out.** If no contact carries an
  At Risk Since stamp the neglected tier is unreachable; the run says that is a
  read failure, not a clean database.

All 180 checks run **before** every audit, in the same job.

## The go-live gate

| Step | Task | Pass condition |
|---|---|---|
| 1 | Tonight's dry run | Neglected in single figures. The four corrected lists near 127 / 44 / 3,332 / 131. The stamp line non-zero. |
| 2 | `inspect-fub-fields` | An email field separating inbound from outbound, or an accepted decision that the reprieve spares nobody. |
| 3 | Rule set 41 | Pond routing matches Battr's, or is accepted as a known divergence. |
| 4 | Resend domain | Agent digests can send from therolandteam.com. |
| 5 | Two weeks shadowing | Drift under 5% on every list in `comparison.csv`, including one Tuesday. |
| 6 | One live nudge | The stamp comes back on the person. |
| 7 | Two switches | `sweepOnBackfilledTexts`, then `BATTR_LIVE`. Deliberately separate. |

**For the reviewer.** The policy surface is `scripts/battr/rules.mjs` and
`scripts/battr/lists.mjs`; `scripts/battr/observed.mjs` is the ground truth every
claim here is checked against. The place to look hardest is `rules.sweepPond` and
its overflow — the one model we can prove is wrong and have deliberately not
changed, because pond routing is only ever edited from Battr's own screen.

---

Battr's app is unreachable from the build environment — the network policy
refuses `battr.ai` at the proxy — so everything attributed to Battr comes from
its audits screen of 2 September, its fifteen rule screens of 3 September, its
nightly emails of 8 to 15 September, and figures supplied directly. Lead names
and Follow Up Boss ids from those emails are deliberately recorded nowhere in
the repository.
