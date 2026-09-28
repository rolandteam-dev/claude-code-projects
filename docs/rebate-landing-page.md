# The new construction rebate page (rebate.therolandteam.com)

The page linked from the new construction YouTube video. One offer, one form,
no navigation. Built the same way as the relocation guide page
(`docs/guide-landing-page.md`), so everything about sourcing works the same.

## The offer

1% of the base purchase price credited at closing, capped at 50% of the
buyer's agent commission the builder actually pays LPT Realty. Paid by LPT
Realty (never an individual agent, per NRS 645.280(3)), as a Closing
Disclosure credit on financed purchases and by check after closing on cash
purchases. The buyer must sign the buyer agreement and be registered with the
builder before their first visit.

Every number and sentence of the offer lives in
`src/content/newConstructionRebate.ts`: the percentages, the "base purchase
price" definition, the FAQ, the full terms, and the license lines. Change the
offer there and the page, terms, email and FUB note all follow.

**Before launch:** confirm Mike's license number (`agentLicense`, currently
S.0177048 from the Las Vegas REALTORS directory) at the NRED license lookup,
and have LPT Realty compliance review the terms page. NRS 645.315 requires
the licensee's number and the brokerage's name, which the footer, email and
terms all carry. The terms are the program as The Roland Team defines it, not legal
advice.

## What is where

| Piece | File |
| --- | --- |
| Offer, terms, FAQ, form options, contact, licenses | `src/content/newConstructionRebate.ts` |
| Landing page | `src/app/(rebate)/rebate/page.tsx` |
| Thank-you screen (one ask: book the call) | `src/app/(rebate)/rebate/thank-you/page.tsx` |
| Program terms | `src/app/(rebate)/rebate/terms/page.tsx` |
| Chrome (no marketing nav, FUB pixel, display font) | `src/app/(rebate)/layout.tsx` |
| Top bar and footer (with license line) | `src/components/rebate/RebateChrome.tsx` |
| Form | `src/components/rebate/RebateForm.tsx` |
| Intake: FUB lead + email | `src/app/api/rebate/request/route.ts` |
| Confirmation email | `src/lib/rebate/email.ts` |
| Host routing | `src/middleware.ts` (`REBATE_HOST`) |

## The form

Name, email, phone (required here, because the next step is a call to register
the buyer with the builder), timeline, price range, consent.

## How a lead lands in Follow Up Boss

- **Source:** from `?s=` (same channel map as the guide page). No `s` means
  **YouTube**. An unrecognised value lands as "New Construction Rebate Page".
- **Tags:** `New Construction Rebate`, `New Construction`, `Buyer Lead`, plus
  the source name. `Buyer Lead` is one of the default hot-lead alert tags.
- **Type:** `Registration`.
- **Note:** the offer, a NEXT STEP line (book the call and sign the agreement
  before any builder visit), timeline, price range, channel, `From video:
  https://youtu.be/<id>` when `?v=` is present, `?ref=`, and the page URL.

Example links:

- `https://rebate.therolandteam.com/?v=<video id>` (the YouTube description)
- `https://rebate.therolandteam.com/?s=ig` (Instagram bio)
- `https://rebate.therolandteam.com/terms` (the terms, for the description)

## Serving it on its own host

1. Vercel → the project → Settings → Domains → add `rebate.therolandteam.com`.
2. In the therolandteam.com DNS zone (Cloudflare) add `CNAME rebate` → the
   target Vercel shows (DNS only, not proxied, same as `guide`).
3. Vercel → Environment Variables → `REBATE_HOST=rebate.therolandteam.com`
   (Production) and redeploy.

Until step 3 the page is reachable at `/rebate` on any host the deployment
serves, which is also how to preview it.

## Testing

- `curl -X POST localhost:3000/api/rebate/request -H 'content-type: application/json' -d '{"name":"Test Person","email":"you@example.com","phone":"7025550100","timeline":"1 to 3 months","priceRange":"$500,000 to $700,000","consent":true,"video":"abc123XYZ"}'`
  returns `{"ok":true,"crm":…,"email":…}`. Without `FUB_API_KEY` the lead is
  not stored (`crmReason:"not_configured"`); without `RESEND_API_KEY` the
  email is skipped.
- Missing consent, a bad email, a short phone, or a filled honeypot
  (`company`) never reach FUB. Timeline and price range values not in the
  dropdown lists are dropped from the note.
