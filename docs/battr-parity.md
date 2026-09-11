# Battr Parity Audit

**The Roland Team · Internal Battr · rev 2 · 11 September 2026**

Readable version: https://claude.ai/code/artifact/9ea11959-2997-4c87-a980-643adb3d8f08

Every behaviour of the Battr subscription set against what we have built — now
with real numbers on both sides. Three of Battr's own audit nights and one
census of the live database. Each row is marked **confirmed**, **inferred**, or
**gap**, and nothing here is asserted from memory.

| | |
|---|---|
| Our funnel | **6.8%** of the member pool survives into the audit list. Battr keeps 7.1%. |
| Hot Leads | **19 : 19** — ours against Battr's, exactly. Warm Back Up lands within 2.5%. |
| Field names | **2** stand between this and a faithful mirror. Every numeric gap traces to them. |
| Automated checks | **144**, run before every audit. If they fail, the audit does not run. |

## Verdict — structurally faithful, two field names from finished

The part with no direct confirmation behind it — how the combined list sheds 93%
of its own members — turns out to behave almost exactly as Battr's does. That
was the open question this audit was built around, and it has closed favourably.

| The funnel | Member pool | → Audit list | Kept |
|---|---:|---:|---:|
| Battr | 12,064 | 862 | 7.1% |
| Ours | 10,533 | ~720 | **6.8%** |

And the 1,531 missing from our pool is almost exactly the **1,262** sitting in
the four nurture lists we currently cannot populate. The shortfall is not spread
thinly across the model; it is one population, with one cause.

> **Not ready — and the reason is small.** We read `timeframe`; Follow Up Boss
> returns `timeframeId`. We read text messages in bulk; FUB refuses to serve
> them. Neither is a design problem, and every numeric disagreement below traces
> to one or the other.

## Evidence — three of Battr's own nights

| Date | Day | In audit | At risk | Neglected | Source |
|---|---|---:|---:|---:|---|
| 2 Sep | Wed | 866 | 17 | 7 | Aida Audits screen |
| 8 Sep | Tue | 903 | 23 | 45 | audit emails |
| 10 Sep | Thu | 862 | 20 | 4 | raw `.eml`, both halves |

Three things fall out of those rows that a single night could not have shown.

- **The audit list drains itself.** 903 − 45 swept = 858, plus arrivals → 862
  observed. A swept lead lands in a pond, every member list requires "not in a
  pond", so it leaves the list the same night. The 7 / 45 / 4 spread is not
  volatility — it is the day filter plus the drain, and both are modelled.
- **The interlock, visible in Battr's own record.** Three of the four leads
  swept on Thursday carry `At Risk Since 9/7` — flagged Monday, taken Thursday.
  Monday is a nudge day and not a sweep day; Thursday is both.
- **The exclusion counters are action-time, not membership.** Both read zero on
  every night, including one where the combined list held 903 of a 12,000 pool.
  They cannot be counting selection. Our model is right to do that work in the
  list filters.

## Numbers — ours against theirs, list by list

Our figures from the census of 5 September; Battr's from the source-counts
dropdown of 2 September.

| List | Ours | Battr | Verdict |
|---|---:|---:|---|
| 🌶️ Hot Leads | 19 | 19 | exact |
| 🌤️ Warm Back Up | 10,514 | 10,783 | −2.5% |
| 🔥 Weekly Nurture | 0 | 144 | gap — `timeframeId` |
| 😎 Bi-Weekly Nurture | 0 | 226 | gap — `timeframeId` |
| 🌱 Monthly Nurture | 0 | 355 | gap — `timeframeId` |
| 👀 Quarterly Nurture | 0 | 537 | gap — `timeframeId` |
| 🗓️ CLEAN UP: no timeframe | 8,959 | 4,200 | gap — same cause |

> **Why CLEAN UP is double, and why that is reassuring.** Every nurture lead
> whose timeframe we cannot read falls through the four bands into the
> no-timeframe list. 8,959 against Battr's 4,200 is not a second bug — it is the
> first one, seen from the other side. Fix the field and both numbers move
> together.

### And our one audit run

| | Ours, 4 Sep | Battr, 10 Sep | Why |
|---|---:|---:|---|
| At Risk | 8 | 20 | Missing nurture population, and leads skip the tier |
| Neglected | 55 | 4 | Blind to texts, so leads jump straight past "at risk" |

That inversion is the texts bug rendered as a number. A lead we cannot see a
text for is not merely miscounted — it skips the warning tier entirely and
arrives as neglected. Which is exactly why that run refused to sweep.

## Behaviour — capability by capability

| Behaviour | Battr | Ours | State |
|---|---|---|---|
| Run schedule | ~6:55–7:09 PM PT | 02:00 UTC = 7:00 PM PT | confirmed |
| Compliance states | compliant / at risk / neglected | identical, plus `excluded` | confirmed |
| The six member lists | read off the source-counts dropdown | the same six, same thresholds | confirmed |
| Combined-list shedding | keeps 7.1% of its pool | keeps 6.8% | confirmed |
| At-risk action | one note, once per lead | same text, same idempotency | confirmed |
| Neglected action | sweep to pond | same | confirmed |
| Day filters | nudge daily, sweep Tue–Fri | same — and seen working across 9/7 → 9/10 | confirmed |
| Warn-first interlock | `At Risk Since` must exist | same, re-checked in the sweep loop | confirmed |
| Exclusions | counters are action-time | done in the list filters | confirmed |
| Sweep target | Pond / Shark Tank | Shark Tank | confirmed |
| Pond overflow | no Money Time in any observed sweep | first 25 Shark Tank, rest Money Time | **unconfirmed** |
| Per-run cap | none seen; 45 in one night | 30 — binds on a Tuesday | ours |
| Timeframe bands | four nurture lists, 1,262 leads | match nobody | **gap** |
| Last touch | calls and texts | calls only — FUB refuses bulk texts | **gap** |
| 📊 Database Health Score | 13 sources, 20,099 records | not modelled | **gap** |
| 🎤 AI TEXT REPLIES | 9 records | not modelled | **gap** |

## Where we deliberately differ

- **Full undo** *(safer)* — every sweep logged with lead, agent and pond; one
  command reverses a night. Battr has no equivalent.
- **It refuses to act on partial evidence** *(safer)* — when a communication
  channel cannot be read, nudges hold, sweeps hold, and the agent emails are
  withheld. Battr has no notion of distrusting its own input.
- **A 30-sweep cap, and a cold-start guard** *(safer)* — the cap binds on
  Tuesdays by design and says so in the report. The guard stops a first run
  reading an existing database as 53,786 new leads.
- **New lead sources protected by default** *(safer)* — 138 sources mapped, 117
  audited, 21 protected, plus every "Schneider *" as a group.
- **Outbound email never counts** *(stricter)* — FUB batch-emails thirty leads
  in one click. An agent who only emails reads as neglected — intended.
- **Inbound counts, and a reply spares** *(softer)* — a call or text from the
  lead resets the clock; an email reply within 14 days stops the sweep.
- **"Inbound, never answered"** *(new)* — the counterweight: leads who reached
  out and got nothing back, longest wait first, at the top of the agent's own
  email.
- **A worst-first scoreboard, and a nightly reconciliation table** *(new)* —
  Battr's emails were near-100% unread. The acceptance test now runs itself
  every night.

## Gaps — what is left

| Gap | Costs | Closed by |
|---|---|---|
| The timeframe id map | Four sweeping lists match nobody — 1,262 leads Battr audits and we do not. | `inspect-fub-fields`. Probes `/timeframes` for id → name. |
| Last touch from texts | Leads skip the warning tier. Sweeps are disabled whenever it bites. | The same run — it lists every person-level last-contact field. |
| Pond overflow | On a 45-sweep Tuesday, 20 leads into a pond Battr never uses. | The 8 Sep neglected email, as a `.eml`. |
| Two unmodelled lists | Reporting completeness. Neither can act. | Their rule screens. |
| Thresholds on three monitoring lists | May report a wrong split. Cannot act. | Their rule screens, or leave them — the nightly table shows the drift. |
| The engine-fixes patch | Eight commits of corrections not yet applied. | The file, or those commits pushed to a branch. |

## Proof — how this is known to be true

The characteristic failure here is not a crash. It is a rule that quietly does
nothing while the run looks healthy. It has happened nine times, and every fix
added the guard rather than only the patch.

- **No list is silently empty** *(test)* — each of the eleven lists gets a
  contact built to fall inside it, and must select and flag it.
- **No report-only list can reach the sweep** *(test)* — asserted over the whole
  set, so a new monitoring list cannot be wired in by accident.
- **A client under contract is protected twice** *(test)* — by the list not
  acting, and by the stage exclusion, independently.
- **The suite cannot delete the audit trail** *(test)* — it used to, every run,
  taking the ownership baseline with it, which recreated the cold start that
  fabricated 53,786 at bats.
- **Truncation and unknown tasks are fatal** *(runtime)* — a short database read
  throws. A run where nothing would execute is red, not green — the scheduled
  audit silently skipped itself for weeks before that guard existed.

## The go-live gate

| Step | Task | Pass condition |
|---|---|---|
| 1 | `inspect-fub-fields` | A timeframe id → name map exists, and some field carries last contact. |
| 2 | `census`, after the fix | The four nurture lists populate. CLEAN UP falls toward 4,200. Pool approaches 12,000. |
| 3 | `audit` / dry | **Audited population near 862–903**, at risk near 20, neglected in single figures on a Wed–Fri. |
| 4 | Two weeks shadowing | Counts track Battr's nightly, including one Tuesday. |
| 5 | `BATTR_LIVE=true` | — |

**For the reviewer.** The policy surface is `scripts/battr/rules.mjs` and
`scripts/battr/lists.mjs`. `scripts/battr/observed.mjs` is the ground truth this
document is checked against, including all three observation nights. The place
to look hardest is no longer `runCombinedList` — the funnel now matches — but
`normalizeContact`, where two field names are read that Follow Up Boss does not
return.

---

Battr's app is unreachable from the build environment — the network policy
refuses `battr.ai` at the proxy — so everything attributed to Battr comes from
its audits screen of 2 September, its audit emails of 8 and 10 September, and
rule details supplied directly. Lead names and FUB ids from those emails are
deliberately not recorded anywhere in the repository.
