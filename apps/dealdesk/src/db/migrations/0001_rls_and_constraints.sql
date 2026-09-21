-- ---------------------------------------------------------------------------
-- Tenant isolation, append-only audit, and the extraction review gate.
--
-- The app connects as `dealdesk_app`, a NOBYPASSRLS role. Every tenant table
-- has RLS enabled AND FORCED, so a forgotten `where team_id = ...` in
-- application code cannot return another tenant's rows. Team context is set
-- per transaction by withTeam() via set_config('app.current_team_id', ..., true).
-- ---------------------------------------------------------------------------

-- Reads the current transaction's team context. STABLE so the planner can
-- hoist it out of per-row evaluation.
CREATE OR REPLACE FUNCTION app_current_team_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.current_team_id', true), '')::uuid
$$;

-- --------------------------------------------------------------------------
-- Strict tenant tables: team_id is NOT NULL, so no context means no rows.
-- --------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  strict_tables text[] := ARRAY[
    'teams', 'team_members', 'contacts', 'consent_records',
    'deals', 'deal_parties', 'deal_dates', 'deal_milestones',
    'documents', 'extractions', 'extraction_reviews',
    'email_messages', 'email_attachments', 'sms_messages',
    'status_requests', 'update_proposals',
    'notification_rules', 'notifications',
    'client_links', 'deal_risk_flags',
    'audit_events', 'external_refs'
  ];
BEGIN
  FOREACH t IN ARRAY strict_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    -- `teams` keys on its own id; every other table on team_id.
    IF t = 'teams' THEN
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON %I USING (id = app_current_team_id()) '
        'WITH CHECK (id = app_current_team_id())', t);
    ELSE
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON %I USING (team_id = app_current_team_id()) '
        'WITH CHECK (team_id = app_current_team_id())', t);
    END IF;
  END LOOP;
END $$;

-- --------------------------------------------------------------------------
-- Shared-catalog tables: team_id IS NULL means a system-owned row that every
-- tenant may READ but nobody may write through the app role.
-- --------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  shared_tables text[] := ARRAY['milestone_templates', 'risk_rules'];
BEGIN
  FOREACH t IN ARRAY shared_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I '
      'USING (team_id = app_current_team_id() OR team_id IS NULL) '
      'WITH CHECK (team_id = app_current_team_id())', t);
  END LOOP;
END $$;

-- --------------------------------------------------------------------------
-- Child tables with no team_id of their own: reachable only through a parent
-- the caller can already see.
-- --------------------------------------------------------------------------
ALTER TABLE milestone_template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_template_steps FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON milestone_template_steps;
CREATE POLICY tenant_isolation ON milestone_template_steps
  USING (EXISTS (
    SELECT 1 FROM milestone_templates mt
    WHERE mt.id = template_id
      AND (mt.team_id = app_current_team_id() OR mt.team_id IS NULL)))
  WITH CHECK (EXISTS (
    SELECT 1 FROM milestone_templates mt
    WHERE mt.id = template_id AND mt.team_id = app_current_team_id()));

ALTER TABLE client_link_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_link_views FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON client_link_views;
CREATE POLICY tenant_isolation ON client_link_views
  USING (EXISTS (
    SELECT 1 FROM client_links cl
    WHERE cl.id = client_link_id AND cl.team_id = app_current_team_id()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM client_links cl
    WHERE cl.id = client_link_id AND cl.team_id = app_current_team_id()));

-- --------------------------------------------------------------------------
-- `users` is deliberately NOT tenant-scoped (a person can belong to several
-- teams), so it is restricted to users sharing a team with the caller.
-- --------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON users;
CREATE POLICY tenant_isolation ON users
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = users.id AND tm.team_id = app_current_team_id()))
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- Infrastructure tables (jobs, webhook_deliveries) are owner-only: they are
-- written by the cron runner and webhook handlers over the admin connection
-- and are never read through a tenant session. RLS on with no permissive
-- policy means the app role sees nothing.
-- --------------------------------------------------------------------------
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries FORCE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- audit_events is append-only. Rejecting UPDATE/DELETE in the database means
-- the trail survives an application bug, not just good intentions.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_events_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only (attempted %)', TG_OP;
END $$;

DROP TRIGGER IF EXISTS audit_events_no_update ON audit_events;
CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION audit_events_immutable();

-- --------------------------------------------------------------------------
-- The review gate: a contract-sourced date may only be stored once a human has
-- reviewed the extraction that produced it. This is the "never auto-trust
-- extracted dates" rule, enforced where it cannot be bypassed.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION deal_dates_require_review() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.source = 'contract' AND NEW.document_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM extractions e
      JOIN extraction_reviews r ON r.extraction_id = e.id
      WHERE e.document_id = NEW.document_id
    ) THEN
      RAISE EXCEPTION
        'deal_dates.source=contract requires a reviewed extraction for document %',
        NEW.document_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS deal_dates_review_gate ON deal_dates;
CREATE TRIGGER deal_dates_review_gate
  BEFORE INSERT OR UPDATE ON deal_dates
  FOR EACH ROW EXECUTE FUNCTION deal_dates_require_review();

-- --------------------------------------------------------------------------
-- updated_at maintenance, so freshness does not depend on every call site
-- remembering to set it.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['teams', 'deals', 'deal_milestones'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS touch_updated_at ON %I', t);
    EXECUTE format(
      'CREATE TRIGGER touch_updated_at BEFORE UPDATE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', t);
  END LOOP;
END $$;

-- --------------------------------------------------------------------------
-- Grants for the restricted runtime role, if it exists. Creating the role
-- needs a password, so that stays a documented one-time step (see README);
-- this block wires up privileges idempotently once it is there.
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dealdesk_app') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO dealdesk_app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dealdesk_app';
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dealdesk_app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dealdesk_app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO dealdesk_app';
    -- Infrastructure tables stay owner-only.
    EXECUTE 'REVOKE ALL ON jobs, webhook_deliveries FROM dealdesk_app';
    RAISE NOTICE 'granted runtime privileges to dealdesk_app';
  ELSE
    RAISE NOTICE 'role dealdesk_app not found; create it and re-run this migration''s grants (see README)';
  END IF;
END $$;
