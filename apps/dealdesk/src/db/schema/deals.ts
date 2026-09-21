import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { contacts, type PartyRole } from "./contacts";
import { dateSource, dealSide, dealStatus, riskSeverity } from "./enums";
import { teams, users } from "./tenancy";

/**
 * Contract deadline keys. Open vocabulary: a new form family adds keys here
 * without a migration. Never rename or reuse a key — they are storage keys.
 */
export type DealDateKey =
  | "acceptance"
  | "emd_due"
  | "due_diligence_end"
  | "appraisal_deadline"
  | "loan_contingency"
  | "title_docs_due"
  | "walkthrough"
  | "coe";

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    /** The agent who owns the transaction. */
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    side: dealSide("side").notNull().default("buy"),
    status: dealStatus("status").notNull().default("draft"),

    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state").notNull().default("NV"),
    postalCode: text("postal_code"),
    county: text("county"),
    apn: text("apn"),
    mlsNumber: text("mls_number"),

    /** Money is always integer cents. Never a float. */
    purchasePriceCents: bigint("purchase_price_cents", { mode: "number" }),
    earnestMoneyCents: bigint("earnest_money_cents", { mode: "number" }),

    /**
     * Calendar dates, not timestamps: a contract deadline is a day in the
     * property's local timezone, and storing it as a timestamp invites
     * off-by-one bugs across zones.
     */
    acceptanceDate: date("acceptance_date", { mode: "string" }),
    closeOfEscrowDate: date("close_of_escrow_date", { mode: "string" }),

    /** e.g. "nvar_rpa" — which form family the deadlines were read from. */
    contractForm: text("contract_form").notNull().default("nvar_rpa"),
    escrowNumber: text("escrow_number"),

    /** Local part of the per-deal inbound address (Phase 4). */
    inboxLocalPart: text("inbox_local_part"),

    riskScore: integer("risk_score").notNull().default(0),
    riskLevel: riskSeverity("risk_level"),

    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [
    index("deals_team_status_idx").on(t.teamId, t.status),
    index("deals_team_risk_idx").on(t.teamId, t.riskScore),
    index("deals_owner_idx").on(t.ownerUserId),
    uniqueIndex("deals_inbox_local_part_key").on(t.inboxLocalPart),
  ],
);

/**
 * Joins a reusable contact to a deal with the role it plays *on that deal*.
 * `side` records whether they are on our side of the table or the other.
 */
export const dealParties = pgTable(
  "deal_parties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    role: text("role").$type<PartyRole>().notNull(),
    side: text("side").$type<"ours" | "theirs">().notNull().default("theirs"),
    isPrimary: boolean("is_primary").notNull().default(false),
    notifyEmail: boolean("notify_email").notNull().default(false),
    notifySms: boolean("notify_sms").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("deal_parties_deal_contact_role_key").on(
      t.dealId,
      t.contactId,
      t.role,
    ),
    index("deal_parties_deal_idx").on(t.dealId),
    index("deal_parties_team_idx").on(t.teamId),
  ],
);

/**
 * The contract deadlines themselves, history-preserving. An addendum that
 * extends due diligence inserts a NEW row and stamps the old one's
 * `supersededById`, so "what was the deadline before the extension" stays
 * answerable a year later.
 */
export const dealDates = pgTable(
  "deal_dates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    key: text("key").$type<DealDateKey>().notNull(),
    value: date("value", { mode: "string" }).notNull(),
    source: dateSource("source").notNull(),
    /** Which uploaded document this date was read from, when applicable. */
    documentId: uuid("document_id"),
    /** 0..1 model confidence when source = contract. Null when human-entered. */
    confidence: integer("confidence_pct"),
    supersededById: uuid("superseded_by_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("deal_dates_deal_key_idx").on(t.dealId, t.key),
    index("deal_dates_team_idx").on(t.teamId),
  ],
);

/**
 * Team members attached to a deal beyond its owner (a co-agent, or the TC who
 * runs it). Agents and TCs can see a deal if they own it OR appear here —
 * enforced in the query layer, so the permission rule lives in one place.
 */
export const dealAssignees = pgTable(
  "deal_assignees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Why they are attached, e.g. "tc", "co_agent". */
    assignmentRole: text("assignment_role").notNull().default("co_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("deal_assignees_deal_user_key").on(t.dealId, t.userId),
    index("deal_assignees_user_idx").on(t.userId),
    index("deal_assignees_team_idx").on(t.teamId),
  ],
);
