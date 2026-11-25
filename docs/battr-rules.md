# Battr's at-risk rules — written down

Battr was cancelled; its last run was **9 Oct 2026**. This is what it did, as exactly as we
know it, so the audit can be held to it. Each line says **how we know**:

- **Confirmed** — read off Battr's own rule screens (3 Sep and 23 Sep 2026), its exclusions
  page, or its nightly emails.
- **Inferred** — reconstructed by reconciling our counts with Battr's nightly numbers. Right
  to the best of the evidence; not read off a screen.
- **Unknown** — we could not tell.

The audit runs these rules by default (`rules.profile: "battr"`). The extra stage rules Mike
asked for on 17 Nov 2026 are defined but switched off (`rules.profile: "extended"`).
The single source of truth is `scripts/battr/lists.mjs`; `npm run battr:test` pins it.

## 1. Who is audited

The **⭐️ Team Leads (Nudges & Sweeps)** list pools six member lists. A lead is audited only if
it is in one of them, is not in a pond, and survives the exclusions in §3.

| Member list (id) | Stage | Other condition |
| --- | --- | --- |
| 🌶️ Hot Leads (1144) | Lead, Attempted Contact | created **under 10 days** ago; no `Import` tag |
| 🌤️ Warm Back Up (1104) | Lead, Attempted Contact | created **over 10 days** ago |
| 🔥 Weekly Nurture (1106) | Nurture, Spoke with Customer | timeframe 0-3 months |
| 😎 Bi-Weekly Nurture (1107) | Nurture, Spoke with Customer | timeframe 3-6 months |
| 🌱 Monthly Nurture (1108) | Nurture, Spoke with Customer | timeframe 6-12 months |
| 👀 Quarterly Nurture (1109) | Nurture, Spoke with Customer | timeframe 12+ months |

*Confirmed* (names, ids and the six-list membership from the rule screens; the id-to-name pairing
was never stated, which cannot change any classification). Every other stage — Appointment Set,
Met with Customer, Showing Homes, Submitting Offers, Listing Agreement, Active Listing, Under
Contract, Closed, Sphere, Trash, Bad Number, and so on — is **not audited**: Battr had a
report-only list for the live stages ("Current & Upcoming Clients") that measured them and
acted on nothing. Nurture with **no timeframe** is likewise report-only ("CLEAN UP", 15 / 30 days).

## 2. At risk and neglected — days since the last agent touch

| List | At risk when quiet **more than** | Neglected (sweepable) when quiet more than, **and** already warned |
| --- | ---: | ---: |
| Hot Leads | 2 days | 4 days |
| Warm Back Up | 10 days | 13 days |
| Weekly Nurture | 10 days | 13 days |
| Bi-Weekly Nurture | 16 days | 19 days |
| Monthly Nurture | 33 days | 36 days |
| Quarterly Nurture | 93 days | 96 days |

*Confirmed* for the thresholds and for the warn-first rule ("Last Communication Days Ago > N
**and** At Risk Notified Date is not empty"). "More than N days" means more than N whole
days have passed, measured as of the 7 PM Pacific run the night belongs to, even when
GitHub starts it at 1 AM.

## 3. Who is excluded

- **Lead source** in Battr's "never swept" bucket: SOI, Sphere, Past Client, Referral, Barrett
  Financial Referral, Import, Imported, Open House (and Signs / Ylopo), FSBO, Expireds, Redx,
  Mojo, Mojo FSBO, ileads-Purchase, speculo_buyer, Lender, Commercial, Recruiting,
  `<unspecified>`, and every source beginning with "Schneider". *Confirmed* (Battr's "Lead Sources
  With Battr Action Exclusions" page, 23 Sep). A source nobody has classified is **excluded**
  until someone does.
- **Agent** on the *Battr Paused* team (today: Mike), and any lead assigned to Mike. *Confirmed.*
- **Lead already in a pond.** *Confirmed.*
- **`my +plus leads` and `Steve Hawks`**: Battr excluded them; the team chose to audit them.
  This is the one deliberate difference and it is labelled in the report.

DNC, Unsubscribed, NOCONTACT, NOTEXT and "Already has an Agent" tags are **not** exclusions in
Battr's list rules, and not here. (They only appear in the old "simple" mode, which does not run.)

## 3a. Where leads can move, and when

- **Nudge** (the note, the stamp, the agent email): every day, once per lead (the stamp stops a repeat).
- **Sweep**: Tuesday to Friday only, never Monday; at least 3 days after the stamp (2 for Hot Leads);
  to **Money Time** if the lead is 10 days old or newer, otherwise **Shark Tank**.
  *Confirmed* ("Pond Assignments" rule set, 23 Sep; sweep days from 33 nights of history).

## 4. What counts as the agent touching a lead

This is the rule that decides at-risk, and it is the one the first live night got wrong.

| Activity | Counts? | How we know |
| --- | --- | --- |
| Outbound call | Yes | Confirmed |
| Outbound text | Yes | Confirmed |
| A call or text **from the lead** (a reply) | Yes — it resets the clock | Inferred (inbound-counts, tested against Battr nights) |
| Email the agent wrote by hand | Yes | Confirmed (Battr's playbook) |
| Automated / batch / action-plan email | **No** | Confirmed (Battr's playbook; Mike's decision, pinned) |
| A reply email from the lead | Yes | Inferred |
| FUB's own last-email date (`lastSentEmail`, `lastEmail`) | Yes | Inferred |
| `Ylopo_Reactivated` lead with a recent Ylopo inbox message | Yes | Inferred (explained 6 of 9 unexplained leads) |
| A stage or timeframe change | Yes (any direction) | **Unknown in part**: Battr appears not to count backward moves or moves into Nurture; we count them all. Open decision. |

Texts and emails cannot be read in bulk from Follow Up Boss, so the audit finds the at-risk
**candidates** from the bulk data (calls, stage changes, FUB's email dates) and then reads each
candidate's **texts and emails person by person**. A lead with an agent text, email or call
inside the window drops off. A lead whose history cannot be read is **held and listed as
unverified** — never read as "no contact".

## 5. How to read the nightly count against Battr's

Battr's last recorded night is **7 Oct 2026: 14 at risk** (`battr-logs/comparison.csv`). There is no
newer Battr number. The report prints our verified count next to that one, says how old it is, and
lists **every lead we flag with the exact rule that fired**, so each can be checked against this page.
The population also drifts (805 leads audited on 7 Oct, about 960 on 16 Nov), so "within a few
leads" is a comparison of proportions as much as counts: Battr flagged about 1.7% of the audited
leads.

## 6. What is NOT in Battr's rules (and is off)

Defined in `scripts/battr/lists.mjs`, switched on only by `rules.profile = "extended"`:
Lead/Attempted over 10 days at **5 / 8**; Spoke with Customer without a timeframe **7 / 10**;
Appointment Set **5 / 8**, Met with Customer **5 / 8**, Showing Homes **3 / 6**; Submitting Offers
**2 / never**; Nurture without a timeframe **30 / 33**; NOCONTACT leads moved to Missed
Opportunities. Nothing there is deleted; it waits for the parity check to pass.

## 7. A warning is only good for the stretch of silence it was issued in

The `Battr At Risk Since` stamp is never cleared. The audit therefore counts it only if the
agent has not touched the lead since the stamp's audit (7 PM PT on the stamp date). A lead that
was warned, worked, and later goes quiet again is warned again before it can be swept
(`warningIsCurrent` in `scripts/battr/contact.mjs`). Added 25 Nov 2026 (Mike), before sweeping starts.
