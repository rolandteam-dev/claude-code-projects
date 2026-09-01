import { homeownerStore } from "@/lib/homeowners/store";
import { homeownerBrand } from "@/lib/homeowners/brand";

export const runtime = "nodejs";

/**
 * One-click unsubscribe from the home value emails (CAN-SPAM). Linked from
 * every send; flips the subscriber off and returns a simple branded
 * confirmation page.
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

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return page("Invalid unsubscribe link.");
  try {
    await homeownerStore().unsubscribe(token);
  } catch {
    // fall through to a friendly message regardless
  }
  return page("You've been unsubscribed from home value updates.");
}
