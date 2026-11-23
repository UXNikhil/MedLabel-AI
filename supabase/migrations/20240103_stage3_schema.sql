-- ==============================================================================
-- MedLabel AI — Stage 3 Database Schema Extensions
-- Tables: reviews, audit_logs
-- Multi-Tenant RLS & Append-Only Immutable Audit Security
-- ==============================================================================

-- 1. Update label_projects check constraint to include 'changes_requested'
ALTER TABLE public.label_projects 
DROP CONSTRAINT IF EXISTS label_projects_status_check;

ALTER TABLE public.label_projects 
ADD CONSTRAINT label_projects_status_check 
CHECK (status IN ('draft', 'in_review', 'approved', 'rejected', 'changes_requested'));

-- 2. Reviews Table (Stage 3 Formal Approvals & Change Requests)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.label_projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'changes_requested')),
    comments TEXT NOT NULL,
    version_tag TEXT NOT NULL DEFAULT 'v1.0-draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Audit Logs Table (Append-Only, Immutable Regulatory Traceability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT NOT NULL,
    actor_name TEXT,
    actor_role TEXT NOT NULL DEFAULT 'editor',
    action TEXT NOT NULL, -- e.g. 'DEVICE_CREATED', 'LABEL_GENERATED', 'COMPLIANCE_RUN', 'REVIEW_SUBMITTED', 'REVIEW_APPROVED', 'CHANGES_REQUESTED', 'PDF_EXPORTED'
    entity_type TEXT NOT NULL, -- 'device', 'project', 'label_version', 'compliance_report', 'review'
    entity_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for Stage 3
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON public.reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Reviews RLS Policies
CREATE POLICY "Authenticated users can view reviews"
    ON public.reviews FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Reviewers and Admins can insert reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- Immutable: NO UPDATE and NO DELETE policies on reviews!

-- Audit Logs RLS Policies: Strictly Append-Only
CREATE POLICY "Authenticated users can read audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "System and users can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- Immutable: NO UPDATE and NO DELETE policies on audit_logs!
