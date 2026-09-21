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
import { memberStatus, teamMemberRole } from "./enums";

/** Quiet hours are stored per team in the team's local timezone. */
export type TeamSettings = {
  quietHours: { startHour: number; endHour: number };
  /** Team-wide default before per-deal overrides. */
  defaultClientEmailMode: "auto" | "approve_first" | "off";
  defaultClientSmsMode: "auto" | "approve_first" | "off";
};

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    /** IANA zone. Contract deadlines are calendar days in this zone. */
    timezone: text("timezone").notNull().default("America/Los_Angeles"),
    /** Clerk organization id, when Clerk is the auth provider. */
    externalOrgId: text("external_org_id"),
    plan: text("plan").notNull().default("pilot"),
    settings: jsonb("settings").$type<TeamSettings>().notNull().default({
      quietHours: { startHour: 21, endHour: 8 },
      defaultClientEmailMode: "auto",
      defaultClientSmsMode: "approve_first",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("teams_slug_key").on(t.slug),
    uniqueIndex("teams_external_org_key").on(t.externalOrgId),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /**
     * Auth provider's user id, kept in its own column so the provider can be
     * swapped without touching any other table.
     */
    externalUserId: text("external_user_id"),
    email: text("email").notNull(),
    name: text("name"),
    phoneE164: text("phone_e164"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    uniqueIndex("users_external_user_key").on(t.externalUserId),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: teamMemberRole("role").notNull().default("agent"),
    status: memberStatus("status").notNull().default("active"),
    /** Receives the weekly risk digest. */
    digestOptIn: boolean("digest_opt_in").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("team_members_team_user_key").on(t.teamId, t.userId),
    index("team_members_team_idx").on(t.teamId),
  ],
);
