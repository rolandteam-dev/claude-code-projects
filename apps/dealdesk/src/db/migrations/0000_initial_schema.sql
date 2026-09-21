CREATE TYPE "public"."actor_type" AS ENUM('user', 'system', 'ai', 'contact');--> statement-breakpoint
CREATE TYPE "public"."change_source" AS ENUM('manual', 'email', 'sms', 'extraction', 'cron', 'api', 'seed');--> statement-breakpoint
CREATE TYPE "public"."comm_channel" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."consent_method" AS ENUM('web_form', 'agent_attested', 'reply_yes', 'import', 'seed');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('pending', 'opted_in', 'opted_out');--> statement-breakpoint
CREATE TYPE "public"."date_source" AS ENUM('contract', 'computed', 'manual', 'amended');--> statement-breakpoint
CREATE TYPE "public"."deal_side" AS ENUM('buy', 'sell', 'dual');--> statement-breakpoint
CREATE TYPE "public"."deal_status" AS ENUM('draft', 'active', 'paused', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."extraction_status" AS ENUM('pending', 'succeeded', 'failed', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."job_state" AS ENUM('queued', 'running', 'succeeded', 'failed', 'dead');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('invited', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('pending', 'in_progress', 'done', 'blocked', 'na');--> statement-breakpoint
CREATE TYPE "public"."msg_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."notification_state" AS ENUM('draft', 'awaiting_approval', 'scheduled', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notify_mode" AS ENUM('auto', 'approve_first', 'off');--> statement-breakpoint
CREATE TYPE "public"."proposal_state" AS ENUM('pending', 'approved', 'rejected', 'auto_applied');--> statement-breakpoint
CREATE TYPE "public"."risk_severity" AS ENUM('info', 'warn', 'critical');--> statement-breakpoint
CREATE TYPE "public"."status_request_state" AS ENUM('sent', 'answered', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('owner', 'admin', 'agent', 'tc');--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_member_role" DEFAULT 'agent' NOT NULL,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"digest_opt_in" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"timezone" text DEFAULT 'America/Los_Angeles' NOT NULL,
	"external_org_id" text,
	"plan" text DEFAULT 'pilot' NOT NULL,
	"settings" jsonb DEFAULT '{"quietHours":{"startHour":21,"endHour":8},"defaultClientEmailMode":"auto","defaultClientSmsMode":"approve_first"}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_user_id" text,
	"email" text NOT NULL,
	"name" text,
	"phone_e164" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"channel" "comm_channel" NOT NULL,
	"status" "consent_status" NOT NULL,
	"method" "consent_method" NOT NULL,
	"proof" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"captured_by_user_id" uuid,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"kind" text DEFAULT 'other' NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone_e164" text,
	"company" text,
	"timezone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" date NOT NULL,
	"source" date_source NOT NULL,
	"document_id" uuid,
	"confidence_pct" integer,
	"superseded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"role" text NOT NULL,
	"side" text DEFAULT 'theirs' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notify_email" boolean DEFAULT false NOT NULL,
	"notify_sms" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"owner_user_id" uuid,
	"side" "deal_side" DEFAULT 'buy' NOT NULL,
	"status" "deal_status" DEFAULT 'draft' NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"state" text DEFAULT 'NV' NOT NULL,
	"postal_code" text,
	"county" text,
	"apn" text,
	"mls_number" text,
	"purchase_price_cents" bigint,
	"earnest_money_cents" bigint,
	"acceptance_date" date,
	"close_of_escrow_date" date,
	"contract_form" text DEFAULT 'nvar_rpa' NOT NULL,
	"escrow_number" text,
	"inbox_local_part" text,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"risk_level" "risk_severity",
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "deal_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"template_step_id" uuid,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer NOT NULL,
	"category" text NOT NULL,
	"status" "milestone_status" DEFAULT 'pending' NOT NULL,
	"due_date" date,
	"due_date_source" date_source,
	"is_deadline" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_source" "change_source",
	"client_visible" boolean DEFAULT true NOT NULL,
	"client_label" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestone_template_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer NOT NULL,
	"category" text NOT NULL,
	"offset_days" integer,
	"offset_basis" text DEFAULT 'none' NOT NULL,
	"offset_date_key" text,
	"is_deadline" boolean DEFAULT false NOT NULL,
	"client_visible" boolean DEFAULT true NOT NULL,
	"client_label" text,
	"help_text" text
);
--> statement-breakpoint
CREATE TABLE "milestone_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"name" text NOT NULL,
	"side" text DEFAULT 'buy' NOT NULL,
	"jurisdiction" text DEFAULT 'NV' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" bigint,
	"sha256" text,
	"page_count" integer,
	"uploaded_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extraction_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"extraction_id" uuid NOT NULL,
	"reviewed_by_user_id" uuid,
	"accepted" jsonb NOT NULL,
	"field_changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extractions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid,
	"document_id" uuid NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"raw_output" jsonb,
	"normalized" jsonb,
	"token_usage" jsonb,
	"cost_cents" integer,
	"latency_ms" integer,
	"status" "extraction_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"email_message_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text,
	"byte_size" integer,
	"storage_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid,
	"direction" "msg_direction" NOT NULL,
	"provider" text NOT NULL,
	"provider_message_id" text,
	"message_id_header" text,
	"in_reply_to" text,
	"thread_key" text,
	"from_email" text,
	"from_name" text,
	"to_emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cc_emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subject" text,
	"text_body" text,
	"html_body" text,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"spam_score" integer,
	"raw_storage_key" text,
	"received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid,
	"contact_id" uuid,
	"direction" "msg_direction" NOT NULL,
	"provider" text DEFAULT 'twilio' NOT NULL,
	"provider_sid" text,
	"from_e164" text,
	"to_e164" text,
	"body" text,
	"status" text,
	"error_code" text,
	"segments" integer,
	"cost_cents" integer,
	"status_request_id" uuid,
	"sent_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"channel" "comm_channel" DEFAULT 'sms' NOT NULL,
	"prompt_body" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sent_message_id" uuid,
	"state" "status_request_state" DEFAULT 'sent' NOT NULL,
	"responded_at" timestamp with time zone,
	"response_raw" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "update_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"source" "change_source" NOT NULL,
	"source_email_id" uuid,
	"source_sms_id" uuid,
	"proposed" jsonb NOT NULL,
	"rationale" text,
	"quote" text,
	"model" text,
	"confidence_pct" integer,
	"state" "proposal_state" DEFAULT 'pending' NOT NULL,
	"decided_by_user_id" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid,
	"event_key" text NOT NULL,
	"channel" "comm_channel" NOT NULL,
	"audience" text DEFAULT 'client' NOT NULL,
	"mode" "notify_mode" DEFAULT 'approve_first' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid,
	"contact_id" uuid,
	"channel" "comm_channel" NOT NULL,
	"template_key" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"body_preview" text,
	"state" "notification_state" DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"approved_by_user_id" uuid,
	"sent_email_id" uuid,
	"sent_sms_id" uuid,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_link_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_link_id" uuid NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"contact_id" uuid,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"label" text,
	"created_by_user_id" uuid,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"last_viewed_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_risk_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"rule_key" text NOT NULL,
	"severity" "risk_severity" NOT NULL,
	"message" text NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_reason" text,
	"snoozed_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "risk_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"severity" "risk_severity" DEFAULT 'warn' NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"action" text NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_user_id" uuid,
	"actor_contact_id" uuid,
	"source" "change_source" NOT NULL,
	"source_ref" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_refs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"system" text NOT NULL,
	"external_id" text NOT NULL,
	"payload" jsonb,
	"synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"kind" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"state" "job_state" DEFAULT 'queued' NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"provider" text NOT NULL,
	"event_type" text,
	"external_id" text,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"payload" jsonb,
	"processed_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_captured_by_user_id_users_id_fk" FOREIGN KEY ("captured_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_dates" ADD CONSTRAINT "deal_dates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_dates" ADD CONSTRAINT "deal_dates_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_parties" ADD CONSTRAINT "deal_parties_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_parties" ADD CONSTRAINT "deal_parties_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_parties" ADD CONSTRAINT "deal_parties_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_milestones" ADD CONSTRAINT "deal_milestones_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_milestones" ADD CONSTRAINT "deal_milestones_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_milestones" ADD CONSTRAINT "deal_milestones_template_step_id_milestone_template_steps_id_fk" FOREIGN KEY ("template_step_id") REFERENCES "public"."milestone_template_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_template_steps" ADD CONSTRAINT "milestone_template_steps_template_id_milestone_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."milestone_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_templates" ADD CONSTRAINT "milestone_templates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extraction_reviews" ADD CONSTRAINT "extraction_reviews_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extraction_reviews" ADD CONSTRAINT "extraction_reviews_extraction_id_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."extractions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extraction_reviews" ADD CONSTRAINT "extraction_reviews_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_message_id_email_messages_id_fk" FOREIGN KEY ("email_message_id") REFERENCES "public"."email_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_requests" ADD CONSTRAINT "status_requests_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_requests" ADD CONSTRAINT "status_requests_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_requests" ADD CONSTRAINT "status_requests_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "update_proposals" ADD CONSTRAINT "update_proposals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "update_proposals" ADD CONSTRAINT "update_proposals_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "update_proposals" ADD CONSTRAINT "update_proposals_source_email_id_email_messages_id_fk" FOREIGN KEY ("source_email_id") REFERENCES "public"."email_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "update_proposals" ADD CONSTRAINT "update_proposals_source_sms_id_sms_messages_id_fk" FOREIGN KEY ("source_sms_id") REFERENCES "public"."sms_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "update_proposals" ADD CONSTRAINT "update_proposals_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_rules" ADD CONSTRAINT "notification_rules_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_rules" ADD CONSTRAINT "notification_rules_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_link_views" ADD CONSTRAINT "client_link_views_client_link_id_client_links_id_fk" FOREIGN KEY ("client_link_id") REFERENCES "public"."client_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_links" ADD CONSTRAINT "client_links_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_links" ADD CONSTRAINT "client_links_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_links" ADD CONSTRAINT "client_links_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_links" ADD CONSTRAINT "client_links_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_risk_flags" ADD CONSTRAINT "deal_risk_flags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_risk_flags" ADD CONSTRAINT "deal_risk_flags_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_rules" ADD CONSTRAINT "risk_rules_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_contact_id_contacts_id_fk" FOREIGN KEY ("actor_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_refs" ADD CONSTRAINT "external_refs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_user_key" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "team_members_team_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_slug_key" ON "teams" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_external_org_key" ON "teams" USING btree ("external_org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_external_user_key" ON "users" USING btree ("external_user_id");--> statement-breakpoint
CREATE INDEX "consent_contact_channel_idx" ON "consent_records" USING btree ("contact_id","channel","captured_at");--> statement-breakpoint
CREATE INDEX "consent_team_idx" ON "consent_records" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "contacts_team_idx" ON "contacts" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "contacts_team_phone_idx" ON "contacts" USING btree ("team_id","phone_e164");--> statement-breakpoint
CREATE INDEX "contacts_team_email_idx" ON "contacts" USING btree ("team_id","email");--> statement-breakpoint
CREATE INDEX "deal_dates_deal_key_idx" ON "deal_dates" USING btree ("deal_id","key");--> statement-breakpoint
CREATE INDEX "deal_dates_team_idx" ON "deal_dates" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deal_parties_deal_contact_role_key" ON "deal_parties" USING btree ("deal_id","contact_id","role");--> statement-breakpoint
CREATE INDEX "deal_parties_deal_idx" ON "deal_parties" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "deal_parties_team_idx" ON "deal_parties" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "deals_team_status_idx" ON "deals" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "deals_team_risk_idx" ON "deals" USING btree ("team_id","risk_score");--> statement-breakpoint
CREATE INDEX "deals_owner_idx" ON "deals" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deals_inbox_local_part_key" ON "deals" USING btree ("inbox_local_part");--> statement-breakpoint
CREATE UNIQUE INDEX "deal_milestones_deal_key_key" ON "deal_milestones" USING btree ("deal_id","key");--> statement-breakpoint
CREATE INDEX "deal_milestones_deal_sort_idx" ON "deal_milestones" USING btree ("deal_id","sort_order");--> statement-breakpoint
CREATE INDEX "deal_milestones_team_idx" ON "deal_milestones" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "deal_milestones_due_idx" ON "deal_milestones" USING btree ("team_id","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "milestone_steps_template_key_key" ON "milestone_template_steps" USING btree ("template_id","key");--> statement-breakpoint
CREATE INDEX "milestone_steps_template_idx" ON "milestone_template_steps" USING btree ("template_id","sort_order");--> statement-breakpoint
CREATE INDEX "milestone_templates_team_idx" ON "milestone_templates" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "documents_deal_idx" ON "documents" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "documents_team_idx" ON "documents" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "documents_sha_idx" ON "documents" USING btree ("team_id","sha256");--> statement-breakpoint
CREATE INDEX "extraction_reviews_extraction_idx" ON "extraction_reviews" USING btree ("extraction_id");--> statement-breakpoint
CREATE INDEX "extraction_reviews_team_idx" ON "extraction_reviews" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "extractions_document_idx" ON "extractions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "extractions_team_idx" ON "extractions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_attachments_msg_idx" ON "email_attachments" USING btree ("email_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_provider_msg_key" ON "email_messages" USING btree ("provider","provider_message_id");--> statement-breakpoint
CREATE INDEX "email_deal_idx" ON "email_messages" USING btree ("deal_id","received_at");--> statement-breakpoint
CREATE INDEX "email_team_idx" ON "email_messages" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sms_provider_sid_key" ON "sms_messages" USING btree ("provider","provider_sid");--> statement-breakpoint
CREATE INDEX "sms_deal_idx" ON "sms_messages" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "sms_team_idx" ON "sms_messages" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "sms_contact_idx" ON "sms_messages" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "status_requests_deal_idx" ON "status_requests" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "status_requests_contact_idx" ON "status_requests" USING btree ("contact_id","state");--> statement-breakpoint
CREATE INDEX "status_requests_team_idx" ON "status_requests" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "update_proposals_deal_state_idx" ON "update_proposals" USING btree ("deal_id","state");--> statement-breakpoint
CREATE INDEX "update_proposals_team_idx" ON "update_proposals" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "notification_rules_team_deal_idx" ON "notification_rules" USING btree ("team_id","deal_id");--> statement-breakpoint
CREATE INDEX "notifications_state_sched_idx" ON "notifications" USING btree ("state","scheduled_for");--> statement-breakpoint
CREATE INDEX "notifications_deal_idx" ON "notifications" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "notifications_team_idx" ON "notifications" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "client_link_views_link_idx" ON "client_link_views" USING btree ("client_link_id","viewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "client_links_token_hash_key" ON "client_links" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "client_links_deal_idx" ON "client_links" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "client_links_team_idx" ON "client_links" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deal_risk_flags_deal_rule_key" ON "deal_risk_flags" USING btree ("deal_id","rule_key");--> statement-breakpoint
CREATE INDEX "deal_risk_flags_team_idx" ON "deal_risk_flags" USING btree ("team_id","severity");--> statement-breakpoint
CREATE UNIQUE INDEX "risk_rules_team_key_key" ON "risk_rules" USING btree ("team_id","key");--> statement-breakpoint
CREATE INDEX "audit_team_deal_idx" ON "audit_events" USING btree ("team_id","deal_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_refs_system_entity_key" ON "external_refs" USING btree ("system","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "external_refs_team_idx" ON "external_refs" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "jobs_claim_idx" ON "jobs" USING btree ("state","run_after");--> statement-breakpoint
CREATE INDEX "jobs_team_idx" ON "jobs" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_provider_external_key" ON "webhook_deliveries" USING btree ("provider","external_id");--> statement-breakpoint
CREATE INDEX "webhook_provider_idx" ON "webhook_deliveries" USING btree ("provider","created_at");