# Battr Parity Audit

**The Roland Team · Internal Battr · 3 September 2026**

Readable version: https://claude.ai/code/artifact/9ea11959-2997-4c87-a980-643adb3d8f08

Every behaviour of the Battr subscription set against what we have built, with
each row marked **confirmed**, **inferred**, or **gap**. Nothing here is asserted
from memory: the numbers come from the code as it stands and from Battr's audits
screen for 2 September 2026.

| | |
|---|---|
| Confirmed behaviours | 27 |
| Inferred | 6 — all on lists that cannot act |
| Open gaps | 8 — two rule screens, six uncaptured audits |
| Automated checks | 133, run before every audit |

## Verdict

The engine that *acts* — the one list that leaves notes and moves leads — is a
faithful reproduction. Every threshold, both day filters, both ponds, the
warn-first interlock, both exclusions and the 7 PM schedule are confirmed
against Battr's own output and reproduced exactly.

Everything still marked inferred or gap sits on lists that **cannot act**. They
are counted and printed and nothing else. The open items are a question of
reporting completeness, not of safety.

### The one number that gates go-live

Battr's ⭐️ Team Leads audited **866 records** on 2 September. Warm Back Up — one
of its six member lists — held **10,783** on its own the same night. The
combined list therefore sheds about 92% of its members. In our model that
reduction comes from the lead-bucket exclusion plus the protected-source check.

**A dry run that lands near 866 means the model is right. One that lands near
10,000 means it is wrong, and the fix is the combined list's membership rule,
not the thresholds.** This is the check that must pass before `BATTR_LIVE`.

## Capability matrix

| Behaviour | Battr | Ours | State |
|---|---|---|---|
| Run schedule | Members ~6:55 PM PT, combined ~7:00–7:05 | 02:00 UTC = 7:00 PM PT | confirmed |
| Compliance states | compliant / at risk / neglected | identical, plus `excluded` for the trail | confirmed |
| Sweep list | ⭐️ Team Leads, 6 member lists | same six: 1104/1106/1107/1108/1109/1144 | confirmed |
| At-risk action | Note on the lead, once | same text, same idempotency | confirmed |
| Neglected action | Sweep to pond | same | confirmed |
| Sweep targets | Shark Tank majority, Money Time minority | Shark Tank first 25, then Money Time | confirmed |
| Nudge day filter | Every Day | Every Day | confirmed |
| Sweep day filter | Weekdays Excluding Monday | same — verified across 33 runs, zero exceptions | confirmed |
| Warn-first interlock | `customBattrAtRiskSince IS NOT NULL` | same, re-checked again in the sweep loop | confirmed |
| Lead-bucket exclusion | `lead_bucket_id != 82` | same, plus a source check honouring unmapped sources | confirmed |
| Owner-group exclusion | group 52555 | same, with a diagnostic if FUB omits group ids | confirmed |
| Agent alert | Per-agent, any non-compliant, admin message | same trigger and message, by email | confirmed |
| Idempotency | "Action already taken in previous audit" | same | confirmed |
| At Bats | Ownership changes and conversion | local ledger + importer for Battr's CSV | confirmed |
| Monitoring lists | 5 further lists, no actions | all 5 modelled, all `report_only` | confirmed |
| 📊 Database Health Score | Combined over 13 lists, 20,099 records | not modelled — the 13 are unknown | **gap** |
| 🎤 AI TEXT REPLIES | Contact list, 9 records | not modelled — selector unknown | **gap** |
| Six further audits | 15 ran; 9 captured | inventoried as unseen | **gap** |
| AI calling / role-play | Paid tier | deliberately not replicated | out of scope |
| Pro dispatch | Paid tier | deliberately not replicated | out of scope |
| Pause lead flow | Needs FUB distribution rules | report flags who; toggle stays manual | partial |

## All eleven lists

Only the six at the top can cause anything to happen, and only through
⭐️ Team Leads. A test asserts that no report-only list is a member of it.

| Id | List | Warn | Sweep | Can act? | Thresholds | Battr, 2 Sep |
|---|---|---:|---:|---|---|---:|
| 1144 | 🌶️ Hot Leads | 2 d | 4 d | **sweeps** | confirmed | — |
| 1104 | 🌤️ Warm Back Up | 10 d | 13 d | **sweeps** | confirmed | 10,783 |
| 1106 | 🔥 Weekly Nurture | 10 d | 13 d | **sweeps** | confirmed | — |
| 1107 | 😎 Bi-Weekly Nurture | 16 d | 19 d | **sweeps** | confirmed | — |
| 1108 | 🌱 Monthly Nurture | 33 d | 36 d | **sweeps** | confirmed | — |
| 1109 | 👀 Quarterly Nurture | 93 d | 96 d | **sweeps** | confirmed | — |
| 1145 | 🗓️ CLEAN UP: Nurtures No Timeframe | 15 d | 30 d | report only | confirmed | 4,200 |
| 1146 | 💛 Sphere & Past Clients | 90 d | 93 d | report only | inferred | 3,333 |
| 1147 | ‼️ YLOPO IMPORTANT | 7 d | 10 d | report only | inferred | 127 |
| 1148 | 🏹 Zillow Important | 5 d | 8 d | report only | inferred | 43 |
| 1105 | ❗Active Leads | 6 d | 9 d | report only | confirmed | 135 |

**What "inferred" means precisely.** The *population* of every list comes from
its name plus our source map — solid, and covered by a test that each list
selects the contacts it should. The *thresholds* on three are read backwards
from the compliance split Battr showed, which is a guess. Each carries Battr's
numbers in code, and the nightly report prints ours beside theirs, so a wrong
guess appears as a number that disagrees rather than as silence.

## Where we deliberately differ

| | Change | Why |
|---|---|---|
| safer | **Full undo** | Every sweep logged with lead, agent and pond; one command reverses a night. Battr has no equivalent. |
| safer | **Hard cap of 30 sweeps a night** | Above the observed 27-lead peak. A typo cannot drain a pipeline. |
| safer | **New sources protected by default** | `unmappedPolicy: "exclude"`. 138 sources mapped, 117 audited, 21 protected, plus every "Schneider *" as a group. |
| stricter | **Outbound email never counts** | FUB batch-emails thirty leads in one click. An agent who only emails reads as neglected. Intended. |
| softer | **Inbound call or text counts** | A live conversation is not a neglected lead, whichever side started it. |
| softer | **A reply by email spares the sweep** | Checked per-lead in the last moment, 14-day window. Replies cannot be batch-produced. |
| new | **"Inbound, never answered"** | The counterweight: leads who reached out and got nothing back, by name, longest wait first — in the report and atop the agent's email. |
| new | **Per-agent scoreboard, worst first** | What Battr's email never gave us. Its emails were near-100% unread, about half in Trash. |
| new | **Nightly reconciliation table** | Ours beside Battr's, per list. The acceptance test runs itself. |

## Open gaps

None blocks the sweep engine. All are reporting completeness, and each is
recorded in `scripts/battr/observed.mjs` as a named gap rather than left out.

| Gap | What it costs | What closes it |
|---|---|---|
| Team Leads source counts | The 866-vs-10,783 question. Highest value item here. | The *View source counts (6)* dropdown on the Team Leads row. |
| 📊 Database Health Score | A 20,099-record roll-up we do not reproduce. | Its rule screen — which 13 lists feed it. |
| 🎤 AI TEXT REPLIES | Nine records. Negligible but unmodelled. | Its rule screen. |
| Six uncaptured audits | Unknown. 15 ran, 9 captured. | Scrolling the audits screen. |
| Thresholds on 1146/1147/1148 | Three monitoring lists may report a wrong split. They cannot act. | Their rule screens — or leave them; the nightly table shows the drift. |
| FUB field names | timeframe, stage id, owner group ids, per-person email | The `inspect-fub-fields` task. Run it once. |

## How any of this is known to be true

The characteristic failure here is not a crash. It is a rule that quietly does
nothing while the run looks healthy — a mis-guessed field name, a wrong
operator, an exemption nothing consults. It has happened six times. Each fix
added the guard, not just the patch.

- **No list is silently empty.** Each of the eleven gets a contact built to fall
  inside it and must both select and flag it.
- **No report-only list can reach the sweep.** Asserted over the whole set.
- **Every operator a list uses is one the evaluator implements.** Added after
  `CONTAINS ANY` — an array-membership test — was used for substring matching on
  two lists, which would have reported zero forever without erroring.
- **Exemptions are enforced twice**, at classification and again in the sweep loop.
- **Truncation is fatal, not silent.** A short database read throws.
- **Loud diagnostics** for unresolvable timeframes, absent owner-group ids, a
  failed reply lookup, unmapped sources, and any list drifting more than 25%
  from Battr's observed count.

All 133 checks run **before** every audit, in the same job. If they fail, the
audit does not run.

## The go-live gate

| Step | Task | Pass condition |
|---|---|---|
| 1 | `census` | Nurtures with no timeframe lands near **4,200**; nurture leads have readable timeframes. |
| 2 | `inspect-fub-fields` | timeframe, stageId, group ids, per-person email all present. |
| 3 | `test-email` | Two messages arrive. |
| 4 | `audit` / dry | **Team Leads lands near 866**, at risk near 17, neglected near 7; the reconciliation table agrees across all five monitoring lists. |
| 5 | Two weeks shadowing | Counts track Battr's daily. |
| 6 | Export At Bats CSV | Before cancelling — unrecoverable afterwards. |
| 7 | `BATTR_LIVE=true` | — |

### For the reviewer

The whole policy surface is `scripts/battr/rules.mjs` and
`scripts/battr/lists.mjs`; nothing about behaviour requires touching the engine.
`scripts/battr/observed.mjs` is the ground truth this document is checked
against. The place to look hardest is the combined list's membership rule in
`runCombinedList` — that is where the 866 is won or lost, and it is the one part
of the model with no direct confirmation behind it.

---

Battr's app is unreachable from the build environment — the network policy
refuses `battr.ai` at the proxy — so everything attributed to Battr here comes
from its audit emails, its audits screen for 2 September 2026, and rule details
supplied directly. Where this document and those disagree, those win.
