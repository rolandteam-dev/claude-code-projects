/**
 * Homeowner eligibility — the standing rule for what belongs in the homeowner
 * store: a real, mailable email and a real NEVADA address. Applied at both
 * import paths (bulk cron + real-time webhook) and re-checked at email send
 * time, so out-of-state / junk contacts can neither enter nor be mailed.
 *
 * Location is judged on ZIP FIRST. A Nevada ZIP is 89xxx. A present non-Nevada
 * ZIP is out-of-state. With NO ZIP we return "unknown-location" — a state of
 * "NV" is NOT proof (FUB records frequently carry a defaulted/blank state), and
 * we must never auto-classify an unknown location as out-of-state.
 */
export type EligibilityBucket = "eligible" | "invalid-email" | "out-of-state" | "unknown-location";

export type EligibilityInput = { email?: string; state?: string; zip?: string };

/** Follow Up Boss's no-email placeholder domain — these hard bounce. */
const FUB_NO_EMAIL_DOMAIN = "@notvalidemail.com";

function emailIsInvalid(email: string): boolean {
  if (!email) return true;
  const lower = email.toLowerCase();
  if (lower.startsWith("noemail-")) return true;
  if (lower.endsWith(FUB_NO_EMAIL_DOMAIN)) return true;
  if (lower.includes("@example.")) return true;
  if ((email.match(/@/g) ?? []).length !== 1) return true; // exactly one "@"
  if (/\s/.test(email)) return true; // no whitespace
  const host = email.slice(email.indexOf("@") + 1);
  if (!host.includes(".")) return true; // host must have a dot
  return false;
}

export function eligibilityBucket(input: EligibilityInput): EligibilityBucket {
  const email = (input.email ?? "").trim();
  if (emailIsInvalid(email)) return "invalid-email";

  const zip = (input.zip ?? "").trim();
  if (zip) {
    return /^89\d{3}$/.test(zip) ? "eligible" : "out-of-state";
  }
  // No ZIP: state alone is not proof of Nevada.
  return "unknown-location";
}

export function isEligible(input: EligibilityInput): boolean {
  return eligibilityBucket(input) === "eligible";
}
