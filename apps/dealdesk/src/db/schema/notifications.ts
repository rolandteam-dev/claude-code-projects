import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { deals } from "./deals";
import { commChannel, notificationState, notifyMode } from "./enums";
import { teams, users } from "./tenancy";

/** Team-level default with an optional per-deal override (dealId non-null). */
export const notificationRules = pgTable(
  "notification_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    /** e.g. "milestone.changed", "deal.at_risk". */
    eventKey: text("event_key").notNull(),
    channel: commChannel("channel").notNull(),
    audience: text("audience")
      .$type<"client" | "agent" | "party">()
      .notNull()
      .default("client"),
    mode: notifyMode("mode").notNull().default("approve_first"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("notification_rules_team_deal_idx").on(t.teamId, t.dealId)],
);

/**
 * Every outbound message passes through this one queue, so quiet hours,
 * opt-out checks and approve-first are enforced in exactly one place instead of
 * being re-implemented per feature.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    channel: commChannel("channel").notNull(),
    templateKey: text("template_key").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    /** Rendered preview the agent approves when mode = approve_first. */
    bodyPreview: text("body_preview"),

    state: notificationState("state").notNull().default("draft"),
    /** Quiet-hours-aware send time. */
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sentEmailId: uuid("sent_email_id"),
    sentSmsId: uuid("sent_sms_id"),
    failureReason: text("failure_reason"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("notifications_state_sched_idx").on(t.state, t.scheduledFor),
    index("notifications_deal_idx").on(t.dealId),
    index("notifications_team_idx").on(t.teamId),
  ],
);
