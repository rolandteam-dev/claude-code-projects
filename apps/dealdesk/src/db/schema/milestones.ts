import {
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
import { deals, type DealDateKey } from "./deals";
import { changeSource, dateSource, milestoneStatus } from "./enums";
import { teams } from "./tenancy";

/**
 * Milestone keys are STORAGE KEYS. They key client progress and every audit
 * row. Never renumber one, never reuse one, never repurpose one — add a new key
 * instead. (Same rule as the portal task ids in the marketing repo.)
 */
export type MilestoneKey =
  | "under_contract"
  | "emd_received"
  | "inspection_done"
  | "repair_negotiation_done"
  | "appraisal_ordered"
  | "appraisal_received"
  | "conditional_approval"
  | "clear_to_close"
  | "docs_signed"
  | "funded_recorded"
  | "closed";

export type MilestoneCategory =
  | "contract"
  | "inspection"
  | "financing"
  | "title"
  | "closing";

/** What a step's due date is counted from. */
export type OffsetBasis = "acceptance" | "coe" | "date_key" | "none";

export const milestoneTemplates = pgTable(
  "milestone_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null team = system-owned template available to every tenant. */
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    side: text("side").$type<"buy" | "sell">().notNull().default("buy"),
    jurisdiction: text("jurisdiction").notNull().default("NV"),
    version: integer("version").notNull().default(1),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("milestone_templates_team_idx").on(t.teamId)],
);

export const milestoneTemplateSteps = pgTable(
  "milestone_template_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => milestoneTemplates.id, { onDelete: "cascade" }),
    key: text("key").$type<MilestoneKey>().notNull(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull(),
    category: text("category").$type<MilestoneCategory>().notNull(),

    /** Offset arithmetic. Null offset = no computed due date. */
    offsetDays: integer("offset_days"),
    offsetBasis: text("offset_basis")
      .$type<OffsetBasis>()
      .notNull()
      .default("none"),
    /** When offsetBasis = 'date_key', which contract deadline to count from. */
    offsetDateKey: text("offset_date_key").$type<DealDateKey>(),

    /** True when missing this step is a contractual deadline breach. */
    isDeadline: boolean("is_deadline").notNull().default(false),

    /** Client-facing presentation. Internal steps stay hidden. */
    clientVisible: boolean("client_visible").notNull().default(true),
    clientLabel: text("client_label"),
    helpText: text("help_text"),
  },
  (t) => [
    uniqueIndex("milestone_steps_template_key_key").on(t.templateId, t.key),
    index("milestone_steps_template_idx").on(t.templateId, t.sortOrder),
  ],
);

export const dealMilestones = pgTable(
  "deal_milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    templateStepId: uuid("template_step_id").references(
      () => milestoneTemplateSteps.id,
      { onDelete: "set null" },
    ),
    key: text("key").$type<MilestoneKey>().notNull(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull(),
    category: text("category").$type<MilestoneCategory>().notNull(),
    status: milestoneStatus("status").notNull().default("pending"),

    dueDate: date("due_date", { mode: "string" }),
    /** Surfaced in the UI so nobody mistakes a computed date for a contract one. */
    dueDateSource: dateSource("due_date_source"),
    isDeadline: boolean("is_deadline").notNull().default(false),

    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** How this milestone got marked done — email, SMS, a human, or the system. */
    completedSource: changeSource("completed_source"),

    clientVisible: boolean("client_visible").notNull().default(true),
    clientLabel: text("client_label"),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("deal_milestones_deal_key_key").on(t.dealId, t.key),
    index("deal_milestones_deal_sort_idx").on(t.dealId, t.sortOrder),
    index("deal_milestones_team_idx").on(t.teamId),
    index("deal_milestones_due_idx").on(t.teamId, t.dueDate),
  ],
);
