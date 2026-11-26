import { homeownerStore } from "@/lib/homeowners/store";
import { sendHomeownerActivity } from "@/lib/homeowners/fubActivity";
import { homeownerBrand } from "@/lib/homeowners/brand";
import { verifyEmailSig } from "@/lib/homeowners/unsubToken";

export const runtime = "nodejs";

/**
 * One-click unsubscribe from the home value emails (CAN-SPAM). Linked from
 * every send; flips the subscriber off and returns a simple branded
 * confirmation page.
 *
 * Two kinds of link land here:
 *   • ?token=<homeowner token>  — a store contact (welcome / value digest).
 *   • ?e=<email>&sig=<hmac>     — a token-less transactional recipient (guide /
 *     rebate / cash-offer ack). The signature is minted + verified by
 *     unsubToken.ts, so a one-click POST can suppress the address with no stored
 *     token and nobody can forge an opt-out for an address they don't control.
 */
function page(message: string): Response {
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="robots" content="noindex"/>
    <title>Email preferences · ${homeownerBrand.name}</title></head>
    <body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f4f1ea;margin:0;">
      <div style="max-width:520px;margin:12vh auto;background:#fff;border:1px solid #e7e3db;border-radius:14px;padding:36px;text-align:center;">
        <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2b;font-weight:600;">${homeownerBrand.name}</div>
        <p style="font-size:19px;color:#1c1c1c;margin:16px 0 8px;font-weight:600;">${message}</p>
        <p style="font-size:14px;color:#5a5a5a;margin:0;">Changed your mind? Call
          <a href="tel:${homeownerBrand.phone}" style="color:#8a6d2b;">${homeownerBrand.phone}</a> and we'll turn updates back on.</p>
      </div>
    </body></html>`;
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });
}

async function unsubscribeToken(token: string): Promise<void> {
  try {
    const store = homeownerStore();
    // Read first: after unsubscribe() we still need the contact details, and an
    // agent must see the opt-out in FUB or they will keep emailing them.
    const homeowner = await store.getByToken(token);
    await store.unsubscribe(token);
    if (homeowner) await sendHomeownerActivity("unsubscribe", homeowner);
  } catch {
    // never fail an opt-out request
  }
}

/**
 * Opt out a token-less recipient by their signed email. Returns false when the
 * signature doesn't verify (forged / corrupted link) so the GET page can say so.
 * When it verifies we suppress every matching store row AND tag the FUB contact
 * Unsubscribed, mirroring the token path — the FUB tag matters most, since a
 * guide/rebate lead often isn't in the homeowner store at all.
 */
async function unsubscribeEmail(email: string, sig: string): Promise<boolean> {
  if (!verifyEmailSig(email, sig)) return false;
  const addr = email.trim().toLowerCase();
  try {
    await homeownerStore().suppressByEmail(addr);
    await sendHomeownerActivity("unsubscribe", { email: addr });
  } catch {
    // never fail an opt-out request
  }
  return true;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const token = params.get("token");
  if (token) {
    await unsubscribeToken(token);
    return page("You've been unsubscribed from home value updates.");
  }
  const email = params.get("e");
  const sig = params.get("sig");
  if (email && sig) {
    const ok = await unsubscribeEmail(email, sig);
    return page(ok ? "You've been unsubscribed from our emails." : "Invalid unsubscribe link.");
  }
  return page("Invalid unsubscribe link.");
}

/**
 * RFC 8058 one-click unsubscribe: mailbox providers POST
 * "List-Unsubscribe=One-Click" to the List-Unsubscribe URL (token or signed
 * email in the query string). Must succeed without cookies, redirects, or a
 * confirmation step, and always returns 200 so a provider never retries.
 */
export async function POST(req: Request) {
  const params = new URL(req.url).searchParams;
  const token = params.get("token");
  if (token) {
    await unsubscribeToken(token);
    return new Response(null, { status: 200 });
  }
  const email = params.get("e");
  const sig = params.get("sig");
  if (email && sig) await unsubscribeEmail(email, sig);
  return new Response(null, { status: 200 });
}
