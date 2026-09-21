import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { deals } from "./deals";
import { riskSeverity } from "./enums";
import { teams } from "./tenancy";

export const riskRules = pgTable(
  "risk_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null team = system rule offered to every tenant. */
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    severity: riskSeverity("severity").notNull().default("warn"),
    params: jsonb("params").$type<Record<string, number>>().notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => [uniqueIndex("risk_rules_team_key_key").on(t.teamId, t.key)],
);

/**
 * Upserted on (deal, rule) so a stalled deal carries ONE persistent flag rather
 * than accumulating a new row every time the daily cron runs.
 */
export const dealRiskFlags = pgTable(
  "deal_risk_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    ruleKey: text("rule_key").notNull(),
    severity: riskSeverity("severity").notNull(),
    message: text("message").notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedReason: text("resolved_reason"),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("deal_risk_flags_deal_rule_key").on(t.dealId, t.ruleKey),
    index("deal_risk_flags_team_idx").on(t.teamId, t.severity),
  ],
);
