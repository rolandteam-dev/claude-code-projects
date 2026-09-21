import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Enum policy
 * -----------
 * Small, stable vocabularies are real Postgres enums so the database rejects
 * garbage. Open-ended vocabularies that we expect to grow every phase
 * (milestone keys, party roles, contact kinds) are plain `text` columns typed
 * as TS unions instead — adding a value there must never require a migration.
 */

export const teamMemberRole = pgEnum("team_member_role", [
  "owner",
  "admin",
  "agent",
  "tc",
]);

export const memberStatus = pgEnum("member_status", [
  "invited",
  "active",
  "suspended",
]);

export const dealSide = pgEnum("deal_side", ["buy", "sell", "dual"]);

export const dealStatus = pgEnum("deal_status", [
  "draft",
  "active",
  "paused",
  "closed",
  "cancelled",
]);

export const milestoneStatus = pgEnum("milestone_status", [
  "pending",
  "in_progress",
  "done",
  "blocked",
  "na",
]);

/** Where a date came from. `computed` dates are derived, never trusted as gospel. */
export const dateSource = pgEnum("date_source", [
  "contract",
  "computed",
  "manual",
  "amended",
]);

/** How a change reached us. Every status change records one. */
export const changeSource = pgEnum("change_source", [
  "manual",
  "email",
  "sms",
  "extraction",
  "cron",
  "api",
  "seed",
]);

export const actorType = pgEnum("actor_type", [
  "user",
  "system",
  "ai",
  "contact",
]);

export const msgDirection = pgEnum("msg_direction", ["inbound", "outbound"]);

export const commChannel = pgEnum("comm_channel", ["email", "sms"]);

export const consentStatus = pgEnum("consent_status", [
  "pending",
  "opted_in",
  "opted_out",
]);

export const consentMethod = pgEnum("consent_method", [
  "web_form",
  "agent_attested",
  "reply_yes",
  "import",
  "seed",
]);

export const proposalState = pgEnum("proposal_state", [
  "pending",
  "approved",
  "rejected",
  "auto_applied",
]);

export const extractionStatus = pgEnum("extraction_status", [
  "pending",
  "succeeded",
  "failed",
  "superseded",
]);

export const notifyMode = pgEnum("notify_mode", [
  "auto",
  "approve_first",
  "off",
]);

export const notificationState = pgEnum("notification_state", [
  "draft",
  "awaiting_approval",
  "scheduled",
  "sent",
  "failed",
  "cancelled",
]);

export const riskSeverity = pgEnum("risk_severity", [
  "info",
  "warn",
  "critical",
]);

export const statusRequestState = pgEnum("status_request_state", [
  "sent",
  "answered",
  "expired",
  "failed",
]);

export const jobState = pgEnum("job_state", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "dead",
]);
