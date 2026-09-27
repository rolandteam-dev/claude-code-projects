# The relocation guide landing page (guide.therolandteam.com)

The page linked from every YouTube description and pinned comment. One offer
(two free guides), one form, no navigation. It replaces the AgentLoft page at
therolandteam.com/moving-to-las-vegas-relocation-guide, whose form could not
tell Follow Up Boss where the lead came from.

## What is where

| Piece | File |
| --- | --- |
| Copy, guide links, PDFs, phone, stats, channel map | `src/content/relocationGuides.ts` |
| Landing page | `src/app/(guide)/guide/page.tsx` |
| Thank-you screen (both guides open here) | `src/app/(guide)/guide/thank-you/page.tsx` |
| Chrome (no marketing nav, FUB pixel, display font) | `src/app/(guide)/layout.tsx` |
| Form | `src/components/guide/GuideForm.tsx` |
| Book covers (CSS, scale with font-size) | `src/components/guide/GuideCover.tsx` |
| Intake: FUB lead + email | `src/app/api/guide/request/route.ts` |
| "Your Las Vegas guides" email | `src/lib/guides/email.ts` |
| Host routing | `src/middleware.ts` (`GUIDE_HOST`) |

## The form

One "Name" field, email, phone (optional), consent. The name is split server-side: the first word becomes the FUB first name, everything after it the last name ("Mary Ann Smith" -> Mary / Ann Smith; a lone "Sarah" -> Sarah with no last name). The thank-you screen and the email greet by first name.

## How a lead is sourced

The form posts `channel`, `video`, `ref` and the page URL, all read from the
link the visitor arrived on:

- `?s=<channel>` sets the lead's **Source** in FUB. Recognised values are in
  `channelSources` (yt, ig, fb, tt, x, em, txt and their long forms). No `s`
  means **YouTube**, because that is where the page is linked by default. An
  unrecognised value lands as "Relocation Guide Page" rather than guessing.
- `?v=<youtube video id>` is kept in the FUB note as `From video: https://youtu.be/<id>`,
  so each description can carry its own link and you can see which video sent
  the lead.
- `?ref=<text>` is free text (a campaign name, a short code), also kept in the note.

Every lead is tagged `Relocation Guide` plus the source name, with
type `Registration`. The note also records the full page URL.

Example links for descriptions and posts:

- `https://guide.therolandteam.com/?v=DGQMJufo4l8` (a YouTube description)
- `https://guide.therolandteam.com/?s=ig` (Instagram bio)
- `https://guide.therolandteam.com/?s=em&ref=oct-newsletter`

## Serving it on its own host

1. Vercel → the project → Settings → Domains → add `guide.therolandteam.com`.
2. In the therolandteam.com DNS zone add `CNAME guide` → the target Vercel
   shows (DNS-only, not proxied, same as `home.therolandteam.com`).
3. Vercel → Environment Variables → `GUIDE_HOST=guide.therolandteam.com`
   (Production) and redeploy.

Until step 3 the page is reachable at `/guide` on any host the deployment
serves (for example `home.therolandteam.com/guide`), which is also how to
preview it.

## The PDFs

`pdfUrl` in `src/content/relocationGuides.ts` currently points at the shared
Google Drive files (anyone with the link). To self-host, put the files in
`public/guides/` and change the URLs to `/guides/<file>.pdf`. Nothing else
references them; the email and the thank-you page both read from the content
file.

## Testing

- `curl -X POST localhost:3000/api/guide/request -H 'content-type: application/json' -d '{"name":"Test Person","email":"you@example.com","consent":true,"channel":"yt","video":"DGQMJufo4l8"}'`
  returns `{"ok":true,"crm":…,"email":…}`. Without `FUB_API_KEY` the lead is
  not stored (`crm:false`, `crmReason:"not_configured"`); without
  `RESEND_API_KEY` the email is skipped. The page still opens the guides.
- Missing consent, a bad email, or a filled honeypot (`company`) never reach FUB.
