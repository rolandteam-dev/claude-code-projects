import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { deals } from "./deals";
import { extractionStatus } from "./enums";
import { teams, users } from "./tenancy";

export type DocumentKind =
  | "purchase_agreement"
  | "counter"
  | "addendum"
  | "other";

/**
 * One extracted field, with the evidence behind it. `citation` is what the
 * review screen shows next to the input so the agent can check the value
 * against the contract without opening the PDF.
 */
export type ExtractedField<T> = {
  value: T | null;
  /** 0-100. */
  confidence: number;
  citation?: { page: number; quote: string };
};

/** Deliberately form-agnostic: NVAR is the first form, not the only one. */
export type NormalizedExtraction = {
  property: {
    addressLine1: ExtractedField<string>;
    city: ExtractedField<string>;
    state: ExtractedField<string>;
    postalCode: ExtractedField<string>;
    apn?: ExtractedField<string>;
  };
  money: {
    purchasePriceCents: ExtractedField<number>;
    earnestMoneyCents: ExtractedField<number>;
  };
  parties: Array<{
    role: ExtractedField<string>;
    name: ExtractedField<string>;
    email?: ExtractedField<string>;
    phone?: ExtractedField<string>;
    company?: ExtractedField<string>;
  }>;
  /** Keyed by DealDateKey. ISO yyyy-mm-dd strings. */
  dates: Record<string, ExtractedField<string>>;
};

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    kind: text("kind").$type<DocumentKind>().notNull(),
    /** Private blob key. Contracts never get a permanent public URL. */
    storageKey: text("storage_key").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    byteSize: bigint("byte_size", { mode: "number" }),
    sha256: text("sha256"),
    pageCount: integer("page_count"),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("documents_deal_idx").on(t.dealId),
    index("documents_team_idx").on(t.teamId),
    index("documents_sha_idx").on(t.teamId, t.sha256),
  ],
);

export const extractions = pgTable(
  "extractions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),

    rawOutput: jsonb("raw_output"),
    normalized: jsonb("normalized").$type<NormalizedExtraction>(),

    tokenUsage: jsonb("token_usage").$type<{
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens?: number;
    }>(),
    costCents: integer("cost_cents"),
    latencyMs: integer("latency_ms"),

    status: extractionStatus("status").notNull().default("pending"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("extractions_document_idx").on(t.documentId),
    index("extractions_team_idx").on(t.teamId),
  ],
);

/**
 * The review screen's record. Nothing from `extractions` is allowed to reach
 * `deals` or `deal_dates` until a row exists here — enforced by trigger in the
 * RLS/constraints migration, not just by convention.
 *
 * `fieldChanges` is also free training signal: after ~50 deals it shows exactly
 * which fields the model gets wrong.
 */
export const extractionReviews = pgTable(
  "extraction_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    extractionId: uuid("extraction_id")
      .notNull()
      .references(() => extractions.id, { onDelete: "cascade" }),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** The values the agent actually confirmed, post-edit. */
    accepted: jsonb("accepted").notNull(),
    fieldChanges: jsonb("field_changes")
      .$type<Array<{ field: string; from: unknown; to: unknown }>>()
      .notNull()
      .default([]),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("extraction_reviews_extraction_idx").on(t.extractionId),
    index("extraction_reviews_team_idx").on(t.teamId),
  ],
);
