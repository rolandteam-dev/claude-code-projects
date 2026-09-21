import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { commChannel, consentMethod, consentStatus } from "./enums";
import { teams, users } from "./tenancy";

/** Open vocabulary — adding a kind must not need a migration. */
export type ContactKind =
  | "client"
  | "lender"
  | "escrow"
  | "title"
  | "coagent"
  | "inspector"
  | "other";

/** Per-deal role. Open vocabulary for the same reason. */
export type PartyRole =
  | "buyer"
  | "seller"
  | "buyer_agent"
  | "listing_agent"
  | "loan_officer"
  | "escrow_officer"
  | "title_officer"
  | "tc"
  | "inspector"
  | "other";

/**
 * Contacts are team-scoped and reused across deals — a team's lenders and
 * escrow officers repeat on every transaction.
 */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    kind: text("kind").$type<ContactKind>().notNull().default("other"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    phoneE164: text("phone_e164"),
    company: text("company"),
    /** Falls back to the team timezone when null. Drives quiet hours. */
    timezone: text("timezone"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("contacts_team_idx").on(t.teamId),
    index("contacts_team_phone_idx").on(t.teamId, t.phoneE164),
    index("contacts_team_email_idx").on(t.teamId, t.email),
  ],
);

/**
 * Consent is append-only. The current state of a (contact, channel) pair is the
 * most recent row; a STOP writes a new `opted_out` row rather than mutating an
 * existing one, so consent at any past moment stays provable.
 */
export type ConsentProof = {
  ip?: string;
  userAgent?: string;
  /** The exact wording shown to or received from the contact. */
  text?: string;
  capturedByUserId?: string;
};

export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    channel: commChannel("channel").notNull(),
    status: consentStatus("status").notNull(),
    method: consentMethod("method").notNull(),
    proof: jsonb("proof").$type<ConsentProof>().notNull().default({}),
    capturedByUserId: uuid("captured_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Latest-row lookups per contact+channel.
    index("consent_contact_channel_idx").on(
      t.contactId,
      t.channel,
      t.capturedAt,
    ),
    index("consent_team_idx").on(t.teamId),
  ],
);
