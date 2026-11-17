/**
 * Offer Machine — who may use it. Read from the environment on every call so a
 * changed value takes effect without code changes.
 *
 *   OFFER_ALLOWED_SLACK_USERS   CSV of Slack user ids (U…) who may run /offer.
 *                               EMPTY = NOBODY (fails closed): this drafts
 *                               contracts, so access is opt-in per person.
 *   OFFER_REVIEWER_SLACK_USERS  CSV of Slack user ids who may Approve / Request
 *                               changes on ANY draft (e.g. the broker). The
 *                               requesting agent can always review their own.
 *   OFFER_WORKER_TOKEN          Bearer token the drafting machine presents.
 */
import { timingSafeEqual } from "crypto";

function csv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAllowedUser(slackUserId: string | null | undefined): boolean {
  if (!slackUserId) return false;
  return csv(process.env.OFFER_ALLOWED_SLACK_USERS).includes(slackUserId);
}

/** The agent who asked, or a listed reviewer. Both must also be allowed users. */
export function canReview(requestedBy: string, slackUserId: string | null | undefined): boolean {
  if (!slackUserId || !isAllowedUser(slackUserId)) return false;
  return slackUserId === requestedBy || csv(process.env.OFFER_REVIEWER_SLACK_USERS).includes(slackUserId);
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Bearer-token check for the worker endpoints. Fails closed without a token. */
export function workerAuthorized(req: Request): boolean {
  const token = process.env.OFFER_WORKER_TOKEN;
  if (!token) return false;
  const header = req.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") && safeEqual(header.slice(7), token);
}
