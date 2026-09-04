# Runbook: home.therolandteam.com + homeowner email + FUB webhook

Three go-live steps that all have to be done from the Vercel, Cloudflare, and
Resend dashboards. Do them in order — each one depends on the one before it.

**Rule for every Cloudflare step: ADD records only.** Never edit or delete an
existing record. `www.therolandteam.com` is run by a different provider on this
same zone, and the root `MX` / `TXT` records carry live mail. If a record you
are about to add already exists with a different value, stop and get it merged
deliberately rather than overwriting it.

---

## Part A — Point home.therolandteam.com at the app

The dashboards already work at `rolandluxury.com/dashboard/<token>`. This gives
them a cleaner branded host. Nothing breaks if you stop halfway.

1. **Vercel** → the project serving `rolandluxury.com` → Settings → Domains →
   Add → `home.therolandteam.com`.
2. Vercel shows the record it wants. Copy the **exact** target it displays —
   normally `cname.vercel-dns.com`, but newer projects are sometimes given a
   region-specific target, so use what is on screen, not what is written here.
3. **Cloudflare** → `therolandteam.com` → DNS → Records → Add record:
   - Type: `CNAME`
   - Name: `home`
   - Target: *(exactly what Vercel showed)*
   - Proxy status: **DNS only — grey cloud.** This one matters. Proxied
     (orange) breaks Vercel's certificate issuance, and the domain will sit on
     "Invalid Configuration" indefinitely.
   - TTL: Auto
4. Wait for Vercel to show the domain as **Valid** with SSL issued. Usually a
   few minutes; allow up to an hour. Then load
   `https://home.therolandteam.com` and confirm a real padlock.
5. **Only after that padlock is real:** Vercel → Settings → Environment
   Variables → add for **Production**:
   - `HOMEOWNER_BASE_URL` = `https://home.therolandteam.com`

   Then redeploy.

Why step 5 waits: `src/lib/homeowners/brand.ts` builds every dashboard link and
every CAN-SPAM unsubscribe link in outbound email against this value. Setting it
before the host resolves points those links at a dead domain. Leaving it unset
is safe — the code falls back to the main site origin.

---

## Part B — Turn on homeowner email

### B1. Resend domain

In Resend → Domains, check whether `therolandteam.com` is **Verified**.

If it is not, Resend lists SPF/DKIM/DMARC records to add. In Cloudflare, add
each one exactly as shown, with:

- **CNAME records → Proxy status: DNS only (grey cloud).**
- TXT and MX records have no proxy toggle; add them as-is.

**The one thing to check before adding anything:** look for an existing root TXT
record starting `v=spf1`. If one exists and Resend is also asking for a root
`v=spf1` record, **stop** — two SPF records on the same name is a hard failure
that breaks *existing* mail, not just Resend. They have to be merged into a
single record instead.

Note that Resend's current default setup puts SPF and MX on a `send.`
subdomain (`send.therolandteam.com`), which does *not* collide with root-level
SPF or MX. In that case there is no conflict and you can add them normally. The
conflict risk is only when the records land on the root name.

Then click Verify in Resend until it reads **Verified**. Do not send before that.

### B2. Vercel environment variables

The plan as originally written only covers `HOMEOWNER_EMAIL_ENABLED`, but the
mailer needs three values. `src/lib/homeowners/email.ts` returns
`{"sent": false, "reason": "email not configured"}` if either of the first two
is missing, no matter what the switch is set to.

For **Production**:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | your Resend API key |
| `HOMEOWNER_FROM_EMAIL` | `The Roland Team <home@therolandteam.com>` |
| `HOMEOWNER_EMAIL_ENABLED` | `true` (exactly this string — anything else keeps sending off) |

The from-address domain has to be the domain verified in B1. That is the link
between the two halves of this part.

Then redeploy.

### B3. Test send

Open, with the real admin token substituted in:

```
https://rolandluxury.com/api/admin/email-test?key=ADMIN_TOKEN&to=mike@therolandteam.com
```

Reading the response:

| Response | Meaning |
| --- | --- |
| `{"sent": true}` | Working. Confirm it actually landed in the inbox. |
| `reason: "sending disabled ..."` | `HOMEOWNER_EMAIL_ENABLED` is not exactly `true`. |
| `reason: "email not configured"` | `RESEND_API_KEY` or `HOMEOWNER_FROM_EMAIL` is missing. |
| any other `reason` | Passed through from Resend — almost always an unverified sending domain. |

The response also echoes back `from` and `emailEnabled`, which is usually enough
to tell which variable did not take effect.

---

## Part C — Real-time FUB webhook

### C1. Preconditions

`src/app/api/admin/fub-webhook-setup/route.ts` bails out before it contacts
Follow Up Boss unless both of these are set in Production:

- `FUB_API_KEY`
- `FUB_WEBHOOK_SECRET` **or** `CRON_SECRET` — any long random string. This is
  what authenticates FUB's calls back to the app.

If `CRON_SECRET` is already set from the digest setup, that satisfies it and
nothing further is needed.

### C2. Install

```
https://rolandluxury.com/api/admin/fub-webhook-setup?key=ADMIN_TOKEN&action=install
```

Success reads `"note": "Real-time sync is on ..."`. If any entry shows
`"created": false`, the `response` field carries FUB's verbatim error — that is
the useful part to capture.

Drop `&action=install` to just list what is currently registered, and use
`&action=uninstall` to remove them again. Both are safe to run.

### C3. One thing to know about the callback URL

The webhook URL registered with FUB is built from `site.url` in
`src/lib/site.ts`, **not** from `HOMEOWNER_BASE_URL`. That value is currently:

```
https://www.rolandluxury.com
```

So FUB will call `https://www.rolandluxury.com/api/webhooks/fub?secret=...`.
Note the `www.` — confirm that host resolves and serves the app, not just the
bare `rolandluxury.com`. If only the apex is live, either add `www` as a domain
in Vercel or update `site.url` before installing, otherwise every webhook
delivery fails silently at FUB's end.

Part A does not change this. Moving dashboards to `home.therolandteam.com` and
the FUB callback host are independent.

---

## Order of operations

1. Part A fully, including the padlock check, before setting `HOMEOWNER_BASE_URL`.
2. Part B after A, so email links point at a live host.
3. Part C any time — it is independent of A and B.
