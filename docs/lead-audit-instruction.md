# Nightly Lead Audit — Written Instruction

**To:** Database Manager
**From:** Mike Roland, The Roland Team
**Date:** September 3, 2026
**Subject:** What the nightly lead audit does, when it runs, and what it touches

---

## 1. What it is

We are replacing **Battr** (the $375/month Sisu product) with our own software that
does the same job. It reads our Follow Up Boss database once a night and looks for
leads the assigned agent has stopped working. It warns the agent first. If the lead
stays untouched, it takes the lead off that agent and puts it in a pond where
someone else can pick it up.

Same rules Battr used, same thresholds, same two ponds, same run time. The
difference is that we control the rules now, and every action can be undone.

## 2. How often it runs

| | |
|---|---|
| **Runs** | Every night at 7:00 PM Pacific, automatically |
| **Warning notes** | Every day, including weekends |
| **Sweeps (reassignments)** | Tuesday through Friday only |
| **Monday** | Deliberately skipped, so the weekend backlog gets one full working day of attention before anything is taken away |
| **Volume** | Historically ~10 warnings and ~8 sweeps per day |
| **Ceiling** | Hard cap of 30 sweeps in any single night, no exceptions |

## 3. What it changes in Follow Up Boss

Three things, and nothing else:

1. **A note on the lead.** When a lead first goes at risk, one note is added:
   *"This lead is at risk - reach out and keep them going! 🙌"* plus the number of
   days quiet and the lead source. It is left once, not repeated nightly.
2. **The assigned owner.** When a lead is swept, it moves to the **Shark Tank**
   pond (or **Money Time** once Shark Tank has taken 25 that night). A second note
   records who owned it, how many days it was quiet, and the date it was warned.
3. **Four date fields on the contact record:** `Battr At Risk Since`,
   `Battr Last Nudged`, `Battr Last Swept`, `Battr Last Touch`.

The notes and field names still say "Battr" on purpose, so the history on a record
reads the same before and after the switch.

It does **not** delete anything, does not merge, does not change stage, does not
change tags, and does not email leads.

## 4. Who is impacted

**Agents.** Any agent holding a company lead that has gone quiet past its
threshold. They get a note on the lead, and an alert telling them what is at risk
before it is taken.

**Exempt from the audit entirely — never warned, never swept:**
- Mike Roland's leads (exempt as a user, not by source)
- Anyone in the paused-agent group
- Leads in Under Contract, Pending, Closed, Active Client, Past Client, Trash, or Bad Number
- Leads tagged NOCONTACT, Y_DNC_REGISTRY_TRUE, DNC_Registered_Phone, Unsubscribed, or Already has an Agent
- Leads less than 3 days old
- Leads already sitting in a pond

**Lead sources that are never swept:** SOI, Sphere, Past Client, Referral, Barrett
Financial Referral, Import, Imported, Open House (all variants), FSBO, Expireds,
Redx, Mojo, Mojo FSBO, Lender, Commercial, Recruiting, every source starting with
"Schneider", and unspecified. Sphere and referrals are relationships; imports were
never anyone's lead to work; open houses and self-sourced prospecting were earned
by the agent who did the work.

**Any brand-new lead source is protected by default** until someone classifies it.

Everything else — Zillow, the portals, paid search and social, website and organic,
seller and valuation, signs and mailers, team-generated — is in scope. Those are
company leads and the expectation is that they get worked.

## 5. What counts as working a lead

This is the rule people will ask you about. The clock resets only on an
**outgoing call or an outgoing text from the agent.**

**Does not reset the clock:** an email the agent sent, an automated or drip email,
the lead calling or texting us, a note, a tag, or opening the record.

The reason: Follow Up Boss batch-emails thirty leads in one click. If a sent email
counted as working the lead, one blast would mark the whole database as worked and
the audit would find nobody. An agent who only ever emails will show as neglected.
That is the intended answer, not a bug.

**One exception.** If the **lead writes back**, that lead will not be swept. Nobody
can batch-produce replies, so an incoming email is real evidence of a live
conversation. A reply within the last 14 days holds the lead in place. Those leads
still appear by name in the nightly report under "Neglected but not swept," so a
reply nobody answered surfaces every day until someone handles it.

## 6. The thresholds

Six lists. The hotter the lead, the less silence it tolerates.

| List | Who lands in it | Warn | Sweep |
|---|---|---:|---:|
| 🌶️ Hot Leads | Lead / Attempted Contact, created in the last 10 days, not an import | 2 d | 4 d |
| 🌤️ Warm Back Up | Lead / Attempted Contact, older than 10 days | 10 d | 13 d |
| 🔥 Weekly Nurture | Nurture / Spoke with Customer, timeframe 0–3 months | 10 d | 13 d |
| 😎 Bi-Weekly | timeframe 3–6 months | 16 d | 19 d |
| 🌱 Monthly | timeframe 6–12 months | 33 d | 36 d |
| 👀 Quarterly | timeframe 12+ months | 93 d | 96 d |

A lead is only reassigned if it clears all five of these, in order:

1. Its lead source is in scope
2. Its owner is not exempt and its stage/tags are not protected
3. It is past its list's day count with no call or text
4. **An earlier night already warned the agent** — nothing is ever taken without a warning first
5. It is Tuesday–Friday, and the lead has not replied by email

## 7. Current status — nothing is happening yet

The system runs nightly in **test mode**. It reads the database, classifies every
lead, and writes the full report — then writes **nothing** back to Follow Up Boss.
No notes, no reassignments. We are running it alongside Battr for about two weeks
to confirm the numbers match before it takes over.

When it goes live, every sweep is logged and any night's reassignments can be
reversed in a single command, putting every lead back with the agent who had it.
Battr had no undo. That is the main reason we are comfortable running our own.

## 8. What I need from you

None of this requires you to run anything. It requires the database to be clean
enough for the rules to read it correctly.

1. **Keep `timeframe` filled in on nurture leads.** A lead in Nurture with no
   timeframe falls into none of the four nurture lists and is never audited at all.
2. **Keep `stage` honest.** Stage decides which list a lead lands in, and Under
   Contract / Pending / Closed are what protect live business from being touched.
3. **Flag new lead sources.** The nightly report lists unmapped sources at the
   bottom. Each one needs a decision: audited, or permanently protected. Send them
   to me.
4. **Clean up `BAD_PHONE` records.** Those leads are never swept — an agent can't
   be blamed for a number that doesn't ring — but they stay in the report so the
   record gets fixed rather than quietly rotting.
5. **Tell me if a list looks wrong.** If a list that should hold hundreds of leads
   suddenly reports a handful, a field name has probably changed on Follow Up
   Boss's end. Fast fix, but only if someone notices.

## 9. Questions about a specific lead

The note on the record says which rule fired, how many days it had been quiet, and
who owned it before. Anything the note doesn't answer, send to me.
