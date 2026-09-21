import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { deals } from "./deals";
import { actorType, changeSource, jobState } from "./enums";
import { teams, users } from "./tenancy";

/**
 * Append-only audit trail. Enforced by a rule in the constraints migration:
 * UPDATE and DELETE on this table are rejected outright.
 *
 * This is the record shown when a client says "nobody told me."
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),

    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    /** e.g. "created", "status_changed", "sent", "approved", "token_revoked". */
    action: text("action").notNull(),

    actorType: actorType("actor_type").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorContactId: uuid("actor_contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    /** Manual / email / sms / extraction / cron — how the change reached us. */
    source: changeSource("source").notNull(),
    /** Pointers to the originating message or proposal. */
    sourceRef: jsonb("source_ref")
      .$type<{
        emailMessageId?: string;
        smsMessageId?: string;
        proposalId?: string;
        extractionId?: string;
      }>()
      .notNull()
      .default({}),

    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_team_deal_idx").on(t.teamId, t.dealId, t.createdAt),
    index("audit_entity_idx").on(t.entityType, t.entityId),
  ],
);

/**
 * Integration seam for later phases. FUB, Qualia, SoftPro and Encompass all
 * plug in here with no schema change — which is the whole point of having it
 * before any of them are built.
 */
export const externalRefs = pgTable(
  "external_refs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    system: text("system").notNull(),
    externalId: text("external_id").notNull(),
    payload: jsonb("payload"),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("external_refs_system_entity_key").on(
      t.system,
      t.entityType,
      t.entityId,
    ),
    index("external_refs_team_idx").on(t.teamId),
  ],
);

/** Idempotency ledger for every inbound provider webhook. */
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    eventType: text("event_type"),
    externalId: text("external_id"),
    signatureVerified: boolean("signature_verified").notNull().default(false),
    payload: jsonb("payload"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("webhook_provider_external_key").on(t.provider, t.externalId),
    index("webhook_provider_idx").on(t.provider, t.createdAt),
  ],
);

/**
 * Background work. Drained by /api/cron/jobs once a minute. Rows persist after
 * completion so a failed extraction or send is debuggable after the fact.
 */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    runAfter: timestamp("run_after", { withTimezone: true })
      .notNull()
      .defaultNow(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    state: jobState("state").notNull().default("queued"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    index("jobs_claim_idx").on(t.state, t.runAfter),
    index("jobs_team_idx").on(t.teamId),
  ],
);
