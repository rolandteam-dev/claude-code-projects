/**
 * Seller home-report auto-send. When a Follow Up Boss contact carries the seller
 * tag (default "Seller") AND has a usable home address + email, we seed their
 * private dashboard with a value estimate and send the welcome email — the
 * "home report" — with their dashboard link.
 *
 * Triggers (see webhooks/fub and cron/fub-recent):
 *   - NEW leads: any contact created within SELLER_AUTO_NEW_DAYS (default 3)
 *     that has the tag. Covers "ALL new seller leads" automatically.
 *   - MANUAL: an agent adds the tag to any lead (FUB `peopleTagsCreated`
 *     webhook), regardless of the lead's age.
 *
 * Safety:
 *   - Idempotent. We write a "Home Report Sent" tag to the FUB contact BEFORE
 *     sending (claim), and skip anyone who already has it. A failed send
 *     removes the claim so the next run retries.
 *   - Old contacts that merely already carry the tag are never blasted: the
 *     poll/updated paths only consider recently created contacts.
 *   - Reuses the standing eligibility rule (valid email + Nevada ZIP), the
 *     HOMEOWNER_EMAIL_ENABLED master switch, and the unsubscribe flag.
 *   - Hard daily budget (SELLER_AUTO_DAILY_CAP, default 40 per Las Vegas day)
 *     plus a per-run cap (SELLER_AUTO_MAX_PER_RUN) to protect the sending
 *     domain. Leads over budget wait for the next day.
 */
import { homeownerStore, type Homeowner } from "./store";
import { FUB_BASE, fubHeaders, personToHomeowner } from "./fubMap";
import { valueHome } from "./nvValue";
import { sendWelcomeEmail } from "./email";
import { dashboardUrl } from "./brand";

export const SENT_TAG = "Home Report Sent";

export function sellerTag(): string {
  return (process.env.SELLER_AUTO_TAG || "Seller").trim();
}

export function newLeadWindowDays(): number {
  const n = Number(process.env.SELLER_AUTO_NEW_DAYS ?? 3);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

export function maxPerRun(): number {
  const n = Number(process.env.SELLER_AUTO_MAX_PER_RUN ?? 25);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.trunc(n), 200) : 25;
}

/** Hard ceiling on seller reports per Las Vegas calendar day (protects sender reputation). */
export function dailyCap(): number {
  const n = Number(process.env.SELLER_AUTO_DAILY_CAP ?? 40);
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.trunc(n), 1000) : 40;
}

export type SellerAutoResult = {
  personId: string;
  status: "sent" | "would-send" | "skipped" | "failed";
  reason?: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function tagsOf(person: any): string[] {
  return Array.isArray(person?.tags) ? person.tags.map((t: unknown) => String(t)) : [];
}

function hasTag(person: any, tag: string): boolean {
  const want = tag.toLowerCase();
  return tagsOf(person).some((t) => t.trim().toLowerCase() === want);
}

/** Cheap pre-check so callers can count only real candidates against the cap. */
export function isSellerCandidate(person: any, manual: boolean): boolean {
  if (!hasTag(person, sellerTag())) return false;
  if (hasTag(person, SENT_TAG)) return false;
  if (manual) return true;
  const created = person?.created ? Date.parse(person.created) : NaN;
  if (!Number.isFinite(created)) return false;
  return Date.now() - created <= newLeadWindowDays() * 86_400_000;
}

async function addSentTag(key: string, person: any): Promise<boolean> {
  try {
    const res = await fetch(`${FUB_BASE}/v1/people/${encodeURIComponent(String(person.id))}?mergeTags=true`, {
      method: "PUT",
      headers: fubHeaders(key, { "Content-Type": "application/json" }),
      body: JSON.stringify({ tags: [SENT_TAG] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function removeSentTag(key: string, person: any): Promise<void> {
  try {
    const keep = tagsOf(person).filter((t) => t.trim().toLowerCase() !== SENT_TAG.toLowerCase());
    await fetch(`${FUB_BASE}/v1/people/${encodeURIComponent(String(person.id))}`, {
      method: "PUT",
      headers: fubHeaders(key, { "Content-Type": "application/json" }),
      body: JSON.stringify({ tags: keep }),
    });
  } catch {
    // best effort — worst case this person is not retried
  }
}

/**
 * Leave a visible trail on the FUB contact: a note saying the report went out
 * (with the lead's private dashboard link) and, when FUB_DASHBOARD_FIELD is
 * configured, the link in that custom field so agents can click straight to it.
 * Best-effort — the email is already sent, so CRM trouble must not undo it.
 */
async function recordInFub(key: string, person: any, h: Homeowner): Promise<void> {
  const url = dashboardUrl(h.token);
  const when = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  try {
    await fetch(`${FUB_BASE}/v1/notes`, {
      method: "POST",
      headers: fubHeaders(key, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        personId: Number(person.id),
        subject: "Home value report emailed",
        body: `Automatic home value report emailed to ${h.email} on ${when} PT.\nTheir private dashboard: ${url}`,
        isHtml: false,
      }),
    });
  } catch {
    // ignore
  }
  const field = process.env.FUB_DASHBOARD_FIELD;
  if (!field) return;
  try {
    await fetch(`${FUB_BASE}/v1/people/${encodeURIComponent(String(person.id))}`, {
      method: "PUT",
      headers: fubHeaders(key, { "Content-Type": "application/json" }),
      body: JSON.stringify({ [field]: url }),
    });
  } catch {
    // ignore
  }
}

/**
 * Forget that a contact was sent a report (and strip the visible FUB tag) so
 * it can be sent again. For re-testing a test contact only — the permanent
 * per-person claim is what prevents real leads from ever being mailed twice.
 */
export async function resetSellerReport(person: any): Promise<void> {
  const key = process.env.FUB_API_KEY;
  if (!key) return;
  await homeownerStore().releaseSellerPerson(String(person?.id ?? ""));
  await removeSentTag(key, person);
}

/**
 * Send the home report to one FUB contact if they qualify.
 * `manual` = an agent just applied the tag (no age limit).
 * `dryRun` = evaluate and report, change nothing.
 */
export async function maybeSendSellerReport(
  person: any,
  opts: { manual: boolean; dryRun?: boolean }
): Promise<SellerAutoResult> {
  const personId = String(person?.id ?? "");
  const skip = (reason: string): SellerAutoResult => ({ personId, status: "skipped", reason });

  const key = process.env.FUB_API_KEY;
  if (!key) return skip("FUB_API_KEY not set");
  if (!personId) return skip("no person id");
  if (!hasTag(person, sellerTag())) return skip(`no "${sellerTag()}" tag`);
  if (hasTag(person, SENT_TAG)) return skip("already sent");
  if (!isSellerCandidate(person, opts.manual)) return skip("not a new lead (created outside window)");
  if (process.env.HOMEOWNER_EMAIL_ENABLED !== "true") return skip("sending disabled (HOMEOWNER_EMAIL_ENABLED)");

  const record = personToHomeowner(person);
  if (!record) return skip("needs a valid email and a Nevada address with ZIP");

  const store = homeownerStore();
  await store.upsertContacts([record]);
  const existing = await store.getByToken(record.token);
  if (existing && !existing.subscribed) return skip("unsubscribed");

  if (opts.dryRun) return { personId, status: "would-send" };

  // One send per person, ever. FUB fires several events at once for a new,
  // tagged contact; this atomic claim lets exactly one of them through. (The
  // FUB tag below is only the visible marker — it is a check-then-act and is
  // NOT safe against concurrent runs on its own.)
  if (!(await store.claimSellerPerson(personId))) return skip("already claimed (sent or in progress)");

  // Daily budget. Over-cap leads are left untagged so a later run (next day)
  // picks them up while they are still inside the new-lead window.
  if (!(await store.claimSellerSend(dailyCap()))) {
    await store.releaseSellerPerson(personId);
    return skip(`daily cap reached (${dailyCap()}/day)`);
  }

  if (!(await addSentTag(key, person))) {
    await store.releaseSellerSend();
    await store.releaseSellerPerson(personId);
    return { personId, status: "failed", reason: "could not tag contact in FUB" };
  }

  try {
    const h: Homeowner = existing ?? record;
    if (!h.estimates?.length) {
      const r = await valueHome(h);
      if (r.facts) await store.updateFacts(h.token, r.facts);
      if (r.estimate) {
        await store.addEstimate(h.token, r.estimate);
        h.estimates = [...(h.estimates ?? []), r.estimate];
      }
    }
    const sent = await sendWelcomeEmail(h, { reason: "seller-lead" });
    if (!sent.sent) {
      await removeSentTag(key, person);
      await store.releaseSellerSend();
      await store.releaseSellerPerson(personId);
      return { personId, status: "failed", reason: sent.reason };
    }
    await store.markEmailed(h.token);
    await recordInFub(key, person, h);
    return { personId, status: "sent" };
  } catch (e) {
    await removeSentTag(key, person);
    await store.releaseSellerSend();
    await store.releaseSellerPerson(personId);
    return { personId, status: "failed", reason: String(e) };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
