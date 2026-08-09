# Connecting the site to Follow Up Boss (CRM)

Every lead the website captures can flow **directly** into Follow Up Boss —
no Zapier, no email parsing, no middleman. The code is already built; you just
need to add your API key.

## What's already wired up

- **All lead forms** (Contact, Home Value, Sell, Buy, community pages, etc.)
  post to the site's `/api/lead` endpoint.
- **The AI Concierge chatbot** — when a visitor taps *"Connect me with the
  team,"* that also posts to `/api/lead`.
- `/api/lead` forwards each lead to the **Follow Up Boss Events API**
  (`POST https://api.followupboss.com/v1/events`) — the method FUB recommends
  for website lead capture. New people are created (or matched to an existing
  contact) and an event is logged, so your action plans / smart lists /
  round-robin routing fire automatically, exactly like any other lead source.

Until the API key is set, forms still work for the visitor (they see the
"Thank you" confirmation) but nothing is written to FUB.

## One-time setup (about 5 minutes)

### 1. Get your Follow Up Boss API key
1. Log in to Follow Up Boss as an **admin**.
2. Go to **Admin → API** (in account settings).
3. Copy your **API Key** (or click to create one).

### 2. Add the key to Vercel
1. Open the project in **Vercel → Settings → Environment Variables**.
2. Add a new variable:
   - **Name:** `FUB_API_KEY`
   - **Value:** *(paste the key from step 1)*
   - **Environments:** Production (and Preview, if you want test leads to flow).
3. Save.

### 3. Redeploy
Environment variables only take effect on a new deployment. In Vercel →
**Deployments**, click the latest one and choose **Redeploy** (or just push any
commit).

That's it — the connection is live.

### 4. Test it
1. Go to the live site's **/contact** page and submit a test lead with your own
   email/phone.
2. Within a few seconds it should appear in Follow Up Boss under **People**,
   with the source **"Luxury Website."**

## Optional but recommended: register a "system"

Follow Up Boss recommends that integrations identify themselves with an
`X-System` name and an `X-System-Key`. This improves lead attribution and keeps
your site off shared partner rate limits. The site already sends an `X-System`
name; to add the key:

1. Register your system with Follow Up Boss (via their
   [Registration & Identification](https://docs.followupboss.com/reference/identification)
   page) to receive an `X-System-Key`.
2. In Vercel, add two more environment variables:
   - `FUB_SYSTEM_KEY` — the key FUB gives you
   - `FUB_SYSTEM` — *(optional)* a custom system name; defaults to
     `TheRolandTeamWebsite`
3. Redeploy.

A plain `FUB_API_KEY` on its own works fine — this step is an enhancement, not a
requirement.

## How leads are labeled in FUB

The endpoint sends these fields so leads are easy to route and filter:

| Website field        | Follow Up Boss field            |
| -------------------- | ------------------------------- |
| First / Last name    | Person name                     |
| Email                | Person email                    |
| Phone                | Person phone (mobile)           |
| Message              | Event / note text               |
| Property address     | Prepended to the message        |
| Form context         | Event **type** (e.g. *General Inquiry*, *Seller Inquiry*, *Property Inquiry*) |
| —                    | **Source:** `Luxury Website`    |

The form context and tags are set per form in the site code (each `<LeadForm>`
passes a `type`, `tag`, and `source`), so different pages can trigger different
action plans in FUB.

## Environment variables reference

| Variable         | Required | Purpose                                             |
| ---------------- | -------- | --------------------------------------------------- |
| `FUB_API_KEY`    | Yes      | Your Follow Up Boss API key (Admin → API)           |
| `FUB_SYSTEM_KEY` | No       | X-System-Key from registering the site as a system  |
| `FUB_SYSTEM`     | No       | X-System name (defaults to `TheRolandTeamWebsite`)  |

## Troubleshooting

- **No lead in FUB after submitting:** confirm `FUB_API_KEY` is set for the
  Production environment and that you redeployed after adding it.
- **Form says "Something went wrong":** the API key may be wrong/expired, or FUB
  returned an error. Re-copy the key from Admin → API.
- **Leads arrive but no action plan fires:** check your FUB automations are
  keyed to the source **"Luxury Website"** or the relevant event type.
