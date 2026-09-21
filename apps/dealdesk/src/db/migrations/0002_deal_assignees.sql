CREATE TABLE "deal_assignees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assignment_role" text DEFAULT 'co_agent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deal_assignees" ADD CONSTRAINT "deal_assignees_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_assignees" ADD CONSTRAINT "deal_assignees_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_assignees" ADD CONSTRAINT "deal_assignees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deal_assignees_deal_user_key" ON "deal_assignees" USING btree ("deal_id","user_id");--> statement-breakpoint
CREATE INDEX "deal_assignees_user_idx" ON "deal_assignees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deal_assignees_team_idx" ON "deal_assignees" USING btree ("team_id");
-- Same tenant isolation as every other tenant-scoped table.
ALTER TABLE deal_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_assignees FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON deal_assignees;
CREATE POLICY tenant_isolation ON deal_assignees
  USING (team_id = app_current_team_id())
  WITH CHECK (team_id = app_current_team_id());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dealdesk_app') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON deal_assignees TO dealdesk_app';
  END IF;
END $$;
