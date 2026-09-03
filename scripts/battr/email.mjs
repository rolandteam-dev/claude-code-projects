/**
 * One way out of this system by email, so the report path and the agent path
 * cannot drift apart or fail differently.
 *
 * Uses Resend, matching the site's own sender (`src/lib/homeowners/email.ts`).
 * The API is called over plain fetch rather than the `resend` package because
 * the audit scripts are dependency-free and run straight off a checkout.
 *
 * Resend rejects a send from an unverified domain. That is the single most
 * likely first-run failure, so `describeError` names it in words instead of
 * handing back a status code.
 */

const ENDPOINT = "https://api.resend.com/emails";

/** Where mail comes from. Falls back to the site's sender, then a bare address. */
export function fromAddress() {
  return (
    process.env.BATTR_REPORT_FROM ||
    process.env.HOMEOWNER_FROM_EMAIL ||
    "The Roland Team <battr@therolandteam.com>"
  );
}

/** Can we send at all? Checked once, up front, rather than per recipient. */
export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Turn a Resend failure into something a person can act on.
 *
 * The two that actually happen on a first run are a bad key and an unverified
 * domain, and neither is obvious from the raw response.
 */
export function describeError(status, body) {
  const detail = String(body ?? "").slice(0, 300);

  if (status === 401 || status === 403) {
    if (/domain is not verified|not verified|verify a domain/i.test(detail)) {
      return `Resend will not send from ${fromAddress()} — that domain is not verified on this Resend account. Verify it under Domains, or set BATTR_REPORT_FROM to an address on a domain that is. (${detail})`;
    }
    return `Resend rejected the API key (${status}). Check the RESEND_API_KEY repository secret. (${detail})`;
  }
  if (status === 422) {
    return `Resend rejected the message as invalid — usually a malformed from or to address. From is currently ${fromAddress()}. (${detail})`;
  }
  if (status === 429) return `Resend is rate limiting (429). (${detail})`;
  return `Resend ${status}: ${detail}`;
}

/**
 * Send one message. Throws on failure with a described error — callers decide
 * whether that is fatal or something to record and carry on from.
 *
 * @param {{to: string|string[], subject: string, text: string, html?: string}} message
 */
export async function sendMail({ to, subject, text, html }) {
  if (!mailConfigured()) throw new Error("RESEND_API_KEY is not set");

  const recipients = (Array.isArray(to) ? to : String(to).split(","))
    .map((address) => address.trim())
    .filter(Boolean);
  if (!recipients.length) throw new Error("no recipient address");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromAddress(), to: recipients, subject, text, ...(html ? { html } : {}) }),
  });

  if (!res.ok) throw new Error(describeError(res.status, await res.text()));
  return res.json().catch(() => ({}));
}
