import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { deals } from "./deals";
import { teams, users } from "./tenancy";

/**
 * Tokenized, login-free client access.
 *
 * The raw token (32 random bytes) is shown exactly once, inside the link. Only
 * its SHA-256 hash is stored, so a database leak does not hand out working
 * client URLs. `tokenPrefix` exists purely so the UI can label a link without
 * being able to reconstruct it.
 */
export const clientLinks = pgTable(
  "client_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    tokenHash: text("token_hash").notNull(),
    tokenPrefix: text("token_prefix").notNull(),
    label: text("label"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("client_links_token_hash_key").on(t.tokenHash),
    index("client_links_deal_idx").on(t.dealId),
    index("client_links_team_idx").on(t.teamId),
  ],
);

export const clientLinkViews = pgTable(
  "client_link_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientLinkId: uuid("client_link_id")
      .notNull()
      .references(() => clientLinks.id, { onDelete: "cascade" }),
    /** Hashed, not raw — we need abuse signal, not a visitor log. */
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    viewedAt: timestamp("viewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("client_link_views_link_idx").on(t.clientLinkId, t.viewedAt)],
);
