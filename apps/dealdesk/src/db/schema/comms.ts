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
import {
  changeSource,
  commChannel,
  msgDirection,
  proposalState,
  statusRequestState,
} from "./enums";
import { type MilestoneKey } from "./milestones";
import { teams, users } from "./tenancy";

export const emailMessages = pgTable(
  "email_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    direction: msgDirection("direction").notNull(),

    provider: text("provider").notNull(),
    /** Unique per provider — the idempotency key for webhook replays. */
    providerMessageId: text("provider_message_id"),
    messageIdHeader: text("message_id_header"),
    inReplyTo: text("in_reply_to"),
    threadKey: text("thread_key"),

    fromEmail: text("from_email"),
    fromName: text("from_name"),
    toEmails: jsonb("to_emails").$type<string[]>().notNull().default([]),
    ccEmails: jsonb("cc_emails").$type<string[]>().notNull().default([]),
    subject: text("subject"),
    textBody: text("text_body"),
    htmlBody: text("html_body"),

    hasAttachments: boolean("has_attachments").notNull().default(false),
    spamScore: integer("spam_score"),
    /** Raw MIME kept in blob storage for dispute resolution. */
    rawStorageKey: text("raw_storage_key"),

    receivedAt: timestamp("received_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("email_provider_msg_key").on(t.provider, t.providerMessageId),
    index("email_deal_idx").on(t.dealId, t.receivedAt),
    index("email_team_idx").on(t.teamId),
  ],
);

export const emailAttachments = pgTable(
  "email_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    emailMessageId: uuid("email_message_id")
      .notNull()
      .references(() => emailMessages.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    mimeType: text("mime_type"),
    byteSize: integer("byte_size"),
    storageKey: text("storage_key").notNull(),
  },
  (t) => [index("email_attachments_msg_idx").on(t.emailMessageId)],
);

export const smsMessages = pgTable(
  "sms_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    direction: msgDirection("direction").notNull(),

    provider: text("provider").notNull().default("twilio"),
    providerSid: text("provider_sid"),
    fromE164: text("from_e164"),
    toE164: text("to_e164"),
    body: text("body"),
    status: text("status"),
    errorCode: text("error_code"),
    segments: integer("segments"),
    costCents: integer("cost_cents"),

    /** The status request this message answers, when it is a reply. */
    statusRequestId: uuid("status_request_id"),

    sentAt: timestamp("sent_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sms_provider_sid_key").on(t.provider, t.providerSid),
    index("sms_deal_idx").on(t.dealId),
    index("sms_team_idx").on(t.teamId),
    index("sms_contact_idx").on(t.contactId),
  ],
);

/**
 * A status request sent to a third party, with the reply-key mapping frozen at
 * send time. This is why a reply of "2" three days later is interpreted against
 * what was actually asked, instead of being re-guessed against current state.
 */
export type StatusRequestOption = {
  key: string;
  milestoneKey: MilestoneKey;
  label: string;
};

export const statusRequests = pgTable(
  "status_requests",
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
    channel: commChannel("channel").notNull().default("sms"),

    promptBody: text("prompt_body").notNull(),
    options: jsonb("options")
      .$type<StatusRequestOption[]>()
      .notNull()
      .default([]),

    sentMessageId: uuid("sent_message_id"),
    state: statusRequestState("state").notNull().default("sent"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    responseRaw: text("response_raw"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("status_requests_deal_idx").on(t.dealId),
    index("status_requests_contact_idx").on(t.contactId, t.state),
    index("status_requests_team_idx").on(t.teamId),
  ],
);

/**
 * A model-proposed milestone change awaiting one-click human approval.
 * `quote` is the exact sentence that triggered it — the agent approves evidence,
 * not a black box.
 */
export type ProposedChange = {
  milestoneKey: MilestoneKey;
  toStatus?: "pending" | "in_progress" | "done" | "blocked" | "na";
  completedAt?: string;
  dateKey?: string;
  dateValue?: string;
};

export const updateProposals = pgTable(
  "update_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    source: changeSource("source").notNull(),
    sourceEmailId: uuid("source_email_id").references(() => emailMessages.id, {
      onDelete: "set null",
    }),
    sourceSmsId: uuid("source_sms_id").references(() => smsMessages.id, {
      onDelete: "set null",
    }),

    proposed: jsonb("proposed").$type<ProposedChange[]>().notNull(),
    rationale: text("rationale"),
    /** Verbatim supporting sentence from the source message. */
    quote: text("quote"),
    model: text("model"),
    confidence: integer("confidence_pct"),

    state: proposalState("state").notNull().default("pending"),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("update_proposals_deal_state_idx").on(t.dealId, t.state),
    index("update_proposals_team_idx").on(t.teamId),
  ],
);
