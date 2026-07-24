-- ============================================================
-- Beonix OS — Supabase PostgreSQL Schema
-- Mirrors all SQLAlchemy models for production deployment
-- Run this in the Supabase Dashboard SQL Editor
-- ============================================================

-- ─── 1. LEADS (CRM Contacts / Deals) ────────────────────────
CREATE TABLE IF NOT EXISTS leads (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    company       TEXT,
    phone         TEXT,
    source        TEXT NOT NULL DEFAULT 'CSV Import',
    source_platform TEXT,
    source_campaign TEXT,
    imported_at   TIMESTAMPTZ,
    stage         TEXT NOT NULL DEFAULT 'New',
    score         INTEGER NOT NULL DEFAULT 0,
    priority      TEXT NOT NULL DEFAULT 'Low',
    score_reasoning TEXT,
    manual_review TEXT,
    talking_points TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);

-- ─── 2. ACTIVITIES (Lead Timeline Events) ───────────────────
CREATE TABLE IF NOT EXISTS activities (
    id            SERIAL PRIMARY KEY,
    lead_id       INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,
    content       TEXT NOT NULL,
    "timestamp"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities (lead_id);

-- ─── 3. TRANSCRIPTS (Call Recordings) ───────────────────────
CREATE TABLE IF NOT EXISTS transcripts (
    id              SERIAL PRIMARY KEY,
    lead_id         INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL,
    transcript_text TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_lead_id ON transcripts (lead_id);

-- ─── 4. DOCUMENTS (RAG Knowledge Base) ──────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id                SERIAL PRIMARY KEY,
    filename          TEXT NOT NULL,
    document_type     TEXT NOT NULL,
    file_size         INTEGER NOT NULL,
    uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    chunk_count       INTEGER NOT NULL DEFAULT 0,
    processing_status TEXT NOT NULL DEFAULT 'pending'
);

-- ─── 5. DOCUMENT CHUNKS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_chunks (
    id            SERIAL PRIMARY KEY,
    document_id   INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index   INTEGER NOT NULL,
    content       TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks (document_id);

-- ─── 6. CHAT SESSIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 7. CHAT MESSAGES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id         SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages (session_id);

-- ─── 8. GMAIL CREDENTIALS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS gmail_credentials (
    id            SERIAL PRIMARY KEY,
    client_id     TEXT,
    client_secret TEXT,
    auth_token    TEXT,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 9. DRAFT EMAILS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draft_emails (
    id                 SERIAL PRIMARY KEY,
    lead_id            INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    subject            TEXT NOT NULL,
    body               TEXT NOT NULL,
    status             TEXT NOT NULL DEFAULT 'draft',
    response_received  TEXT,
    response_sentiment TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at            TIMESTAMPTZ,
    replied_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_draft_emails_lead_id ON draft_emails (lead_id);

-- ─── 10. OUTREACH MESSAGES (Email Thread) ───────────────────
CREATE TABLE IF NOT EXISTS outreach_messages (
    id             SERIAL PRIMARY KEY,
    draft_email_id INTEGER NOT NULL REFERENCES draft_emails(id) ON DELETE CASCADE,
    sender         TEXT NOT NULL,
    subject        TEXT NOT NULL,
    body           TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_messages_draft_id ON outreach_messages (draft_email_id);

-- ─── 11. EMAIL ATTACHMENTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS email_attachments (
    id             SERIAL PRIMARY KEY,
    draft_email_id INTEGER NOT NULL REFERENCES draft_emails(id) ON DELETE CASCADE,
    filename       TEXT NOT NULL,
    file_path      TEXT NOT NULL,
    content_type   TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_attachments_draft_id ON email_attachments (draft_email_id);

-- ─── 12. WORKFLOWS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflows (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    status      TEXT DEFAULT 'draft',
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── 13. WORKFLOW NODES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_nodes (
    id          TEXT NOT NULL,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    node_type   TEXT NOT NULL,
    config      JSONB,
    PRIMARY KEY (id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_wf_id ON workflow_nodes (workflow_id);

-- ─── 14. WORKFLOW EDGES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_edges (
    id          SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    source_node TEXT NOT NULL,
    target_node TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_edges_wf_id ON workflow_edges (workflow_id);

-- ─── 15. WORKFLOW EXECUTIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_executions (
    id           SERIAL PRIMARY KEY,
    workflow_id  INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    status       TEXT DEFAULT 'pending',
    started_at   TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_wf_id ON workflow_executions (workflow_id);

-- ─── 16. WORKFLOW EXECUTION LOGS ────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_execution_logs (
    id             SERIAL PRIMARY KEY,
    execution_id   INTEGER NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id        TEXT NOT NULL,
    node_type      TEXT NOT NULL,
    status         TEXT NOT NULL,
    execution_time TIMESTAMPTZ DEFAULT now(),
    result_data    TEXT,
    error_details  TEXT
);

CREATE INDEX IF NOT EXISTS idx_workflow_exec_logs_exec_id ON workflow_execution_logs (execution_id);

-- ─── 17. FOLLOWUPS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS followups (
    id            SERIAL PRIMARY KEY,
    lead_id       INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    description   TEXT,
    followup_type TEXT NOT NULL,
    scheduled_at  TIMESTAMPTZ NOT NULL,
    status        TEXT DEFAULT 'pending',
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followups_lead_id ON followups (lead_id);

-- ─── 18. FOLLOWUP EXECUTIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS followup_executions (
    id               SERIAL PRIMARY KEY,
    followup_id      INTEGER NOT NULL REFERENCES followups(id) ON DELETE CASCADE,
    execution_time   TIMESTAMPTZ DEFAULT now(),
    execution_result TEXT NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followup_executions_fup_id ON followup_executions (followup_id);

-- ─── 19. RECOVERY CASES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS recovery_cases (
    id                 SERIAL PRIMARY KEY,
    lead_id            INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    risk_level         TEXT DEFAULT 'medium',
    reason             TEXT NOT NULL,
    recommended_action TEXT,
    status             TEXT DEFAULT 'pending',
    created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recovery_cases_lead_id ON recovery_cases (lead_id);

-- ─── 20. IMPORT JOBS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS import_jobs (
    id            SERIAL PRIMARY KEY,
    filename      TEXT NOT NULL,
    total_rows    INTEGER DEFAULT 0,
    imported_rows INTEGER DEFAULT 0,
    duplicate_rows INTEGER DEFAULT 0,
    failed_rows   INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'processing',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 21. COMPLIANCE REQUIREMENTS ────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    category   TEXT NOT NULL,
    due_date   TIMESTAMPTZ NOT NULL,
    status     TEXT DEFAULT 'pending',
    owner      TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 22. COMPLIANCE DOCUMENTS ───────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_documents (
    id                  SERIAL PRIMARY KEY,
    requirement_id      INTEGER NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    filename            TEXT NOT NULL,
    upload_date         TIMESTAMPTZ DEFAULT now(),
    verification_status TEXT DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_compliance_docs_req_id ON compliance_documents (requirement_id);

-- ─── 23. COMPLIANCE RISKS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_risks (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    severity        TEXT NOT NULL,
    description     TEXT NOT NULL,
    recommendation  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_risks_req_id ON compliance_risks (requirement_id);

-- ─── 24. INVOICES (Capital / Finance) ───────────────────────
CREATE TABLE IF NOT EXISTS invoices (
    id             SERIAL PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_name  TEXT NOT NULL,
    amount         DOUBLE PRECISION NOT NULL,
    due_date       TIMESTAMPTZ NOT NULL,
    status         TEXT DEFAULT 'sent',
    created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices (invoice_number);

-- ─── 25. PAYMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id             SERIAL PRIMARY KEY,
    invoice_id     INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount         DOUBLE PRECISION NOT NULL,
    payment_date   TIMESTAMPTZ DEFAULT now(),
    payment_method TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments (invoice_id);

-- ─── 26. APPROVAL REQUESTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS approval_requests (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    requester  TEXT NOT NULL,
    approver   TEXT NOT NULL,
    status     TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables. Since Beonix uses a backend
-- service role (not direct client access), we create a
-- permissive policy for the authenticated & service roles.
-- When you add Supabase Auth later, tighten these policies
-- to use auth.uid() checks.
-- ============================================================

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN (
            'leads', 'activities', 'transcripts',
            'documents', 'document_chunks',
            'chat_sessions', 'chat_messages',
            'gmail_credentials', 'draft_emails',
            'outreach_messages', 'email_attachments',
            'workflows', 'workflow_nodes', 'workflow_edges',
            'workflow_executions', 'workflow_execution_logs',
            'followups', 'followup_executions',
            'recovery_cases', 'import_jobs',
            'compliance_requirements', 'compliance_documents', 'compliance_risks',
            'invoices', 'payments', 'approval_requests'
          )
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        -- Drop existing policy if any, then recreate
        EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%s" ON %I', tbl, tbl);
        -- Allow full access for the service_role (backend API)
        EXECUTE format(
            'CREATE POLICY "service_role_all_%s" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
            tbl, tbl
        );
    END LOOP;
END
$$;

-- ============================================================
-- Done! All 26 tables created with indexes and RLS enabled.
-- ============================================================
