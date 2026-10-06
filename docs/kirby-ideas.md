# Kirby Ideas

Internal-platform ideas inspired by Kirby Scofield's post about replacing his
backend broker program, transaction management, answering service and more with
a custom-built internal system. We build these **one at a time**, in order,
and only start the next once the previous is in real use by the team.

Kirby's own claims ("$30k/yr saved", "built in a week") are unverified — treat
them as motivation, not a budget. Our test for each idea is whether an agent
uses it weekly.

## Kirby's list vs. what we already have

| Idea | Status in this repo |
|---|---|
| Custom-branded CMA creator | **Partial** — `src/lib/idx/estimate.ts` pulls comps from Repliers for the home-value tool; no agent-facing, branded, shareable CMA |
| Net sheet app | **Partial** — public `calculators/seller-net-proceeds`; no agent-side version with saved/sendable sheets |
| Listing / offer portal | Not started (Client Portal has journeys, not offers) |
| Transaction management | Not started |
| Accountability system | Not started (FUB holds the raw activity data) |
| Recruiting tracking | Not started |
| Team component / agent roster | Partial — `/admin/clients` reads the FUB roster |
| Links to Zillow marketing tools | Not started (just a links page) |
| Internal messaging | Not started — **skip**, Slack/FUB already do this |
| Answering service replacement | Not started — **skip for now**, telephony/compliance risk |
| Backend broker program | Not started — **last**, highest risk (money + compliance) |

## Order

1. **Branded CMA creator** — in progress (scoping)
2. Agent net sheet (extend the existing calculator)
3. Listing / offer portal
4. Accountability dashboard (from FUB activity)
5. Transaction management
6. Recruiting tracking
7. Zillow marketing links page
8. Re-evaluate: broker back-office, answering service, messaging

Rationale for #1: it reuses the comps engine we already have, it produces a
client-facing asset every agent needs for every listing appointment, and it
touches no money or compliance surface.

## 1. Branded CMA creator

**Goal:** an agent enters a subject address, gets a Roland Team-branded
comparative market analysis (comps, adjustments, suggested range) as a
shareable link and a printable PDF.

**Open questions (need Mike's call before building):**
- Who uses it — agents only (behind `ADMIN_TOKEN`), or also homeowners from the dashboard's "Requested CMA" action?
- Output — web link only, PDF, or both?
- Pricing method — raw comps + agent-picked range, or AVM-assisted suggestion? (An auto-priced CMA shown to clients carries accuracy/liability risk.)
- Does the agent hand-pick and adjust comps? (Real CMAs do; fully automatic ones are weaker.)

**Proposed v1 (smallest useful):** admin page at `/admin/cma` — address in,
comps from Repliers listed, agent toggles which comps to include and edits a
price range, "Generate" produces a noindex branded page at a tokenized URL.
No PDF, no persistence beyond the token, no client-side AVM.

**Done when:** an agent produces a real CMA for a real listing appointment and
says they'd use it again.
