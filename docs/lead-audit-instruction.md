# The Nightly Sweep — Complete Instruction

**The Roland Team · Database Operations**
Rev. 4 — September 3, 2026

Readable version: https://claude.ai/code/artifact/6dc505f0-c2bd-4b87-b1b9-186e9e30a2d8
This file is the same document in plain text. If the two ever disagree, this
file is the one that ships with the code.

Every night at 7 PM, our own software reads the whole Follow Up Boss database
and asks one question about every lead: **has the agent who owns this actually
reached out?** Leads that have gone quiet get the agent a warning. Leads that
stay quiet get moved to a pond where another agent can pick them up.

| | |
|---|---|
| Replaces | Battr (Sisu) |
| Old cost | $375 / month |
| New cost | $0 |
| Runs | Nightly, 7:00 PM PT |
| Status today | **Test mode — writes nothing to Follow Up Boss** |

Three parts. Everyone reads I and II; Mike also reads III.

---

# PART I — THE SYSTEM

## 1. Why we built it

We have been paying Battr about $375 a month to do one job: watch for leads
agents stopped working, warn the agent, then take the lead back and drop it in a
pond. It has been doing roughly 10 warnings and 8 sweeps a day — about 163 leads
reassigned in a six-week stretch. That job is worth doing. Paying a subscription
for it is not.

We rebuilt it in-house using the same rules, read out of Battr's own audit
history: same thresholds, same two ponds (**Shark Tank** and **Money Time**),
same 7 PM run time, same warning-before-sweep behavior. Three things are new: a
daily report worth opening, a per-agent scoreboard, and a one-command undo for
any night's sweeps.

Nothing about anyone's day changes because of the tool. What changes is that the
rules are ours, written down here, and adjustable in an afternoon.

## 2. What happens each night, in order

1. **7:00 PM PT — it reads the database.** Every non-trashed contact, roughly
   54,000 records, plus the agent roster and the pond list.
2. **It works out the last real touch on each lead.** Every outgoing call and
   text from the last 45 days, pulled in one pass and matched to leads.
3. **It sorts every lead into one of six lists**, by stage and timeframe. Leads
   that fit none of the six are not audited at all.
4. **It labels each lead** compliant, at risk, or neglected — against that
   list's own day counts, after removing everything exempt.
5. **At risk → a note on the lead**, once per lead, and the agent is told.
6. **Neglected → the lead moves to a pond.** Tuesday–Friday only, capped at 30 a
   night, only after the five gates in section 6. Every move is logged for undo.
7. **It writes the report.**

## 3. What it writes — and what it never touches

**It writes exactly three things in the CRM:**

1. A note on the lead — one warning note when it first goes at risk, and a
   second note when it is swept.
2. The assigned owner — swept leads move from the agent to a pond.
3. Four date fields on the contact: `Battr At Risk Since`, `Battr Last Nudged`,
   `Battr Last Swept`, `Battr Last Touch`.

**And it emails the agent.** Each agent with anything at risk gets one email a
night listing their own leads — see section 8a. Agents with a clean board get
nothing.

**It never:** deletes, merges or archives a contact; changes a stage; adds,
removes or edits a tag; sends anything to a *lead* (no email, no text, no call);
touches phone numbers, emails or addresses; or changes a smart list or action
plan.

**Why the notes still say "Battr":** the wording and field names keep the Battr
label on purpose, so a contact's history reads the same before and after the
switch. Seeing "Battr:" on a note in October does not mean the old subscription
is still running — it means our system wrote it.

## 4. What counts as working a lead

The clock on a lead resets on a **call** or a **text**, in either direction.

| Resets the clock | Does not reset the clock |
|---|---|
| An outgoing call from the agent | An email the agent sent |
| An outgoing text from the agent | An automated or drip email |
| A call *from* the lead | A note, a tag, or opening the record |
| A text *from* the lead | |

The reason is Follow Up Boss's batch email: thirty leads, one click. If a sent
email counted as working the lead, a single blast would mark the whole database
as worked and the audit would find nobody. A measure that easy to satisfy
measures nothing.

The trade-off is real and intended. An agent who *only* emails will show as
neglected. Under this rule that is the correct answer, not a bug.

**Why inbound counts.** A lead phoning or texting in is a live conversation
whichever side started it, and pulling it away from the agent holding it would
be worse than doing nothing. The cost is that a lead who calls in and is never
called back now reads as compliant. That case does not disappear — the report
carries an **"Inbound, never answered"** section listing exactly those leads by
name, sorted by how long they have been waiting, every night. They are never
swept for it. That list is the one to work.

**The one exception — the lead writes back.** If the lead **replies**, that lead
is not swept. Nobody can batch-produce replies, so an incoming email is real
evidence of a live conversation, and we are not going to pull a lead out from
under an agent who is mid-thread. A reply within the last **14 days** holds the
lead in place.

Spared leads still appear by name in the nightly report under "Neglected but not
swept." A lead who wrote in and never got an answer shows up every single day
until someone handles it. It is a reprieve, not a hiding place.

## 5. Six lists, six different clocks

| List | Who lands in it | Warn | Sweep |
|---|---|---:|---:|
| 🌶️ Hot Leads | Lead / Attempted Contact, created in the last 10 days, not tagged Import | 2 d | 4 d |
| 🌤️ Warm Back Up | Lead / Attempted Contact, older than 10 days | 10 d | 13 d |
| 🔥 Weekly Nurture | Nurture / Spoke with Customer, timeframe 0–3 months | 10 d | 13 d |
| 😎 Bi-Weekly | timeframe 3–6 months | 16 d | 19 d |
| 🌱 Monthly | timeframe 6–12 months | 33 d | 36 d |
| 👀 Quarterly | timeframe 12+ months | 93 d | 96 d |
| 🕳️ Nurture — no timeframe | Nurture / Spoke with Customer, timeframe blank | 30 d | **never** |

The four nurture lists are chosen by the **timeframe** field, so a lead in
Nurture with the field blank used to match none of them and drop out of the
audit entirely — invisible rather than compliant. The seventh list closes that:
those leads are now counted, reported, and warned at 30 days, but **never
swept**. We don't know that lead's real cadence, so reassigning it would be
guessing; getting the timeframe filled in is the actual fix, and that is the
database manager's queue.

It also works as a canary. If the timeframe field name ever changes on Follow Up
Boss's end, every nurture lead lands in this one list at once — loudly — instead
of four lists quietly emptying.

**Not in the audit:** the ❗Active Leads list. It has its own 6/9 day thresholds
and feeds the Database Health Score, but Battr never used it to sweep and
neither do we.

## 6. Five gates before a lead moves

A lead is reassigned only if it clears all five, in order. Any single one stops
it.

1. **The lead source is in scope.** 117 sources are audited; 21 are permanently
   protected. Any source nobody has classified yet is protected by default.
2. **The owner, stage and tags are not exempt.** Mike Roland's leads and the
   paused-agent group are out entirely, as are protected stages and DNC tags.
3. **It is past its list's day count.** No call and no text for longer than that
   list allows. Leads under 3 days old are exempt; leads already in a pond are
   skipped.
4. **The agent was already warned on an earlier night.** A sweep requires
   `Battr At Risk Since` to already be stamped on the record. Nothing is ever
   taken without a warning first. This is the most important safety rule in the
   system, and it is checked twice in the code.
5. **It is Tuesday–Friday, and the lead has not replied.** Warnings go out every
   day; sweeps only Tue–Fri. Monday is skipped so the weekend's backlog gets one
   full working day of attention first.

## 7. Who and what is exempt

**People.** Mike Roland — exempt as a *user*, not as a lead source. Leads
assigned to Mike are never warned, never swept, and generate no alert. The
paused-agent group (owner group 52555) is excluded the same way. No other agent
is exempt.

**Stages — live and closed business is never touched:** Under Contract, Pending,
Closed, Active Client, Past Client, Trash, Bad Number.

**Tags — out of the audit entirely:** NOCONTACT, Y_DNC_REGISTRY_TRUE,
DNC_Registered_Phone, Unsubscribed, Already has an Agent.

`NOTEXT` is deliberately *not* on that list — it closes the text channel, but
the phone still works, so a NOTEXT lead can still be neglected. `BAD_PHONE`
leads are never swept but do stay in the report, so the record gets fixed
instead of quietly rotting.

**Lead sources — never swept:** SOI, Sphere, Past Client, Referral, Barrett
Financial Referral, Import, Imported, Open House, Open House Signs, Open House
(Ylopo), FSBO, Expireds, Redx, Mojo, Mojo FSBO, ileads-Purchase, speculo_buyer,
Lender, Commercial, Recruiting, every source beginning with "Schneider", and
&lt;unspecified&gt;.

The logic: sphere, past clients and referrals are personal relationships;
imports were never anyone's lead to work; open houses and self-sourced
prospecting (FSBO, Expireds, Redx, Mojo) were earned by the agent who did the
work. Every source beginning with "Schneider" is protected as a group, so a new
Schneider source added next month is covered automatically.

Everything else is in scope — Zillow and the portals, paid search and social,
website and organic, seller and valuation, signs and mailers, team-generated.
Those are company leads, and the expectation is that they get worked.

---

# PART II — FOR THE DATABASE MANAGER

## 8. What you'll actually see

- **Every night:** a note on the lead when it first goes at risk. Left once, not
  repeated nightly.
- **Tue–Fri:** a change of owner. A swept lead moves to Shark Tank, or Money
  Time once Shark Tank has taken 25 that night. A second note records who
  held it.
- **Every night:** the report — agent scoreboard worst-first, every sweep, every
  lead held back and why, plus a breakdown by lead source.

The notes, word for word:

```
WARNING NOTE
This lead is at risk - reach out and keep them going! 🙌

12 days with no outreach. Source: Zillow Flex.

SWEEP NOTE
Battr: swept to the Shark Tank pond after 15 days with no outreach.
Previously assigned to Jane Doe. At Risk since 2026-08-19.
```

Both notes name the day count and the source, so anyone reading the record
months later can see exactly why it moved without having to ask.

## 8a. The agent's nightly email

Agents are not left to discover a sweep by noticing a lead has gone. Every agent
who has anything at risk gets one email a night, subject *"N of your leads need
outreach"*, laid out in the order they can act on:

```
At risk leads need to be worked ASAP or they will be swept to the pond.

SWEEPING NEXT RUN (2) — reach out today to keep these:
  • Jane Doe — 15 days quiet (Zillow Flex)
  • John Smith — 14 days quiet (Ylopo Search)

AT RISK (4):
  • ...

MOVED TO THE POND TONIGHT (1) — no longer assigned to you:
  • Gone Already — 16 days quiet (Realtor.com)

A lead is only swept after it has been flagged at risk first. Working it clears
the flag.
```

Three things about it worth knowing:

- **Leads they can still save come first.** Leads already swept are listed last
  and labelled as gone, so nobody wastes a call on a lead they no longer own.
- **A clean board gets no email.** An empty digest every night is how people
  learn to ignore the real one.
- **Agents in the paused group and Mike's leads generate no alerts at all.**

During the two-week shadow period no email is actually sent. The report shows
who *would* have received one.

## 9. Your standing checklist

Nothing here needs you to run anything. It needs the database clean enough for
the rules to read it correctly. In order of impact:

1. **Keep `timeframe` filled in on nurture leads.** No timeframe means the lead
   is in none of the four nurture lists and is never audited. Highest-impact
   item on this list.
2. **Keep `stage` honest.** Stage decides which list a lead lands in, and Under
   Contract / Pending / Closed are what protect live business from being
   touched.
3. **Work the "🕳️ Nurture — no timeframe" list.** Every lead on it is a lead
   nobody can hold to a cadence. Setting the timeframe moves it into the right
   nurture list automatically.
4. **Flag new lead sources to Mike.** The report lists unmapped sources at the
   bottom. Each needs a decision: audited, or permanently protected. Until
   someone decides, it is protected — safe, but unaudited.
5. **Work the `BAD_PHONE` list.** Those leads are never swept, but they stay in
   the report until the number is fixed or the record is retired.
6. **Say something if a list looks wrong.** If a list that should hold hundreds
   suddenly reports a handful, a field name has probably changed on Follow Up
   Boss's end. Fast fix — but only if someone notices.

## 10. Questions you'll get asked

**"I emailed that lead last week. Why did it get taken?"**
Email doesn't reset the clock — section 4. A call or a text does, in either
direction. If the lead emailed *back*, it would not have been swept.

**"They called me, doesn't that count?"**
Yes. A call or text from the lead resets the clock the same as one from the
agent. If a lead was swept anyway, there was no call or text either way inside
the window.

**"I never got a warning."**
Not possible under the rules: a sweep requires the warning note and the At Risk
date to already be on the record from an earlier night. Both are visible on the
contact. If a lead really did move without one, that is a bug — send it to Mike.

**"Can I get the lead back?"**
That's Mike's call, and it's a one-command reversal for a whole night's sweeps.
Individually, an agent can claim it out of the pond like any other pond lead.

**"Is my sphere at risk?"**
No. SOI, Sphere, Past Client, Referral, imports, open houses and self-sourced
prospecting are permanently outside the audit — section 7.

**"It says Battr on the note. Aren't we cancelling that?"**
Yes. The wording stays so contact history reads consistently across the switch.
The note was written by our system.

**"Does it text or email my leads?"**
Never. It writes notes, moves ownership, and stamps four dates. Nothing leaves
the CRM to a lead.

---

# PART III — RUNNING IT (MIKE)

## 11. Where it lives and what it costs

It runs on **GitHub Actions**, on a schedule, out of the same repository as the
website. No server, nothing on anyone's desktop, nothing to keep awake. Code in
`scripts/battr/`; schedule in `.github/workflows/battr-audit.yml`.

Cost is **$0/month**. The only credential is the Follow Up Boss API key stored
as an encrypted repository secret named `FUB_API_KEY` — a second, separate key
from the one Vercel uses for the website's lead capture. The website's key was
never touched.

To run it by hand: repository → **Actions** → *Battr audit* → **Run workflow**.

## 12. Every switch, and where it is

| Switch | Where | What it does |
|---|---|---|
| `BATTR_LIVE` | Actions variable | **The master switch.** Unset or anything but `true` = test mode, writes nothing. Set to `true` and the scheduled run starts acting. |
| `BATTR_ALERT_CHANNEL` | Actions variable | How agents are told: **`email`** (default — one digest per agent, matching Battr), `fub_task` (a task per agent in FUB), or `report_only` (nothing direct). |
| `BATTR_REPORT_FROM` | Actions variable | From address on the agent emails. Must be on a domain verified in Resend. |
| `BATTR_REPORT_TO` | Actions variable | Where *your* nightly report is emailed. Needs `RESEND_API_KEY` too; without both, the report still lands in the run log. |
| `maxSweepsPerRun` | rules.mjs | Hard ceiling per night. Currently **30**. |
| `sweepDayFilter` | rules.mjs | Currently Tuesday–Friday. |
| `exemptAgents` | rules.mjs | Currently **Mike Roland**. Matched on the FUB "Assigned to" name. |
| `requireWarningBeforeSweep` | rules.mjs | The warn-first interlock. Leave on. |
| `inboundEmailSparesSweep` | rules.mjs | A reply from the lead stops the sweep, within a 14-day window. |
| `inboundCountsAsTouch` | rules.mjs | A call or text from the lead resets the clock. On. |
| `unansweredInboundDays` | rules.mjs | How long an unanswered inbound waits before the report names it. 2 days. |
| Seven lists' thresholds | lists.mjs | The day counts in section 5, edited per list. |
| Source classification | sources.mjs | Which of the 138 sources are audited and which are protected. |

`rules.mjs` is the whole policy surface. Nothing about behavior requires
touching the engine itself.

## 13. What to expect, in order

**A. Now — run `inspect-fub-fields` once.**
Actions → Battr audit → Run workflow → task `inspect-fub-fields`. It reports
whether the fields the rules depend on actually exist: timeframe, owner groups,
stage id, and whether we can read a lead's email replies. A wrong field name is
the one failure that looks healthy while doing nothing, so this gets settled
before anything is live. It prints field names, never client names.

**B. Next two weeks — shadow Battr.**
Both systems run. Every night you get a report; nothing is written to FUB.
Compare our counts to Battr's email: roughly 10 at risk and 8 sweeps a day. If
the two track for a week, the mirror is faithful.

**B2. Set up Resend, before going live.**
The agent emails need it. Create a free Resend account, verify
`therolandteam.com` as a sending domain (a few DNS records — same kind of setup
as any mail tool), then add `RESEND_API_KEY` as a repository *secret* and
`BATTR_REPORT_FROM` as a repository *variable*. Until the domain is verified
Resend will only deliver to your own address, so verify before flipping the
switch. If the key is missing on a live run, the report says so in one line
rather than failing thirty times.

**B3. Check every agent has an email on their FUB user record.**
The address comes from the FUB user, not the lead. Any agent without one is
listed as a failure in the report — nobody is silently skipped.

**C. Before you cancel Battr — export the At Bats CSV.**
That history is not recoverable once the subscription ends. An importer is
waiting for it, so the scoreboard starts with real history instead of zero.

**D. Go live — set `BATTR_LIVE` to `true`.**
Settings → Secrets and variables → Actions → Variables. The next 7 PM run starts
acting. Expect roughly 10 notes the first night. Sweeps only on a Tuesday–Friday,
and none at all on night one unless leads were already warned — our interlock
reads our own stamp.

**E. First live week — read the report daily**, specifically "Neglected but not
swept." That is where every held-back lead and its reason lands, and where a
wrong rule shows itself first.

**F. Steady state — the scoreboard is the Monday meeting.** Worst-first, per
agent: assigned, at risk, neglected, swept.

## 14. What the nightly report contains

1. **Summary** — leads audited, at risk (new notes vs. already flagged),
   neglected (swept vs. held back), excluded, and any action skipped today with
   the reason.
2. **Agent scoreboard, worst first** — assigned / at risk / neglected / swept.
3. **Swept to pond** — each lead: from whom, to which pond, days quiet, source.
4. **Neglected but not swept** — every held-back lead and the exact reason: cap
   reached, never warned, protected source, exempt agent, bad phone, or the lead
   replied. **Read this section.**
4b. **Inbound, never answered** — leads who called or texted us with no call or
   text back since. Not swept, by design. The highest-value list in the report.
5. **By lead source** — at risk and neglected per source, unmapped sources
   called out.
6. **At Bats and agent alerts** — ownership changes and conversion rates, then
   which agents were told and how.

The last line of every report is the undo command for that run.

## 15. Undo, and the kill switch

**Undo a night.** Every sweep is written to a log keyed by run id, holding the
lead, the agent it came from, and the pond it went to. One command puts every
lead in that run back with the agent who had it and posts a note saying the
sweep was reversed:

```
node scripts/battr-audit.mjs --undo=<run-id>
```

**Stop everything.** Set `BATTR_LIVE` back to anything but `true` and the next
run reverts to reading and reporting only. To stop even that, disable the
workflow in the Actions tab. Neither loses any history.

Battr had no undo at all. That is the single biggest improvement here, and it is
what makes it safe to be decisive about everything else.

## 16. How it fails, and what that looks like

| If this happens | You'll see | Consequence |
|---|---|---|
| A FUB field gets renamed | A list reporting near-zero leads when it should hold hundreds | That list stops being audited. Nothing is wrongly swept. |
| The reply lookup breaks | A banner: "N leads were not swept because the reply lookup failed" | Sweeps are held, never forced. Nothing moves blind. |
| A new lead source appears | It listed as "Unmapped" at the bottom of the report | Protected by default — never swept until classified. |
| A threshold is typed wrong | An unusually long swept list, stopping at exactly 30 | The cap holds; the rest is undoable with one command. |
| FUB is down or throttling | The Actions run fails, red, with the error | No partial writes; it runs again the next night. |
| The database read comes back short | The run fails outright | Deliberate — a confident report over half the database is worse than no report. |

The engine ships with 103 automated checks that run before every audit. If those
fail, the audit does not run at all.

## 17. Decisions still open

1. **Run `inspect-fub-fields` and send me the output.** Settles timeframe, owner
   group, stage id, and whether we can read email replies.
2. **Set up Resend** so the agent emails can actually send — step B2 above.
   The channel is decided: email, one digest per agent, matching Battr.
3. **Export the Battr At Bats CSV before cancelling.** Unrecoverable afterwards.
4. **Confirm the exempt list is Mike alone.** Battr's own config named nobody
   else.

---

Questions about a specific lead that moved: the note on the record names the
rule that fired, the days it had been quiet, and who owned it before. Anything
the note doesn't answer goes to Mike.

*The Roland Team · Las Vegas & Henderson · internal operations document*
