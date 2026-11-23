-- ==============================================================================
-- MedLabel AI — Stage 2 Database Schema Extensions
-- Tables: label_versions, compliance_rules, compliance_reports, label_comparisons
-- With Row Level Security (RLS) and Audit Timestamps
-- ==============================================================================

-- 4. Label Versions Table (Immutable Version Snapshots)
CREATE TABLE IF NOT EXISTS public.label_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.label_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version_tag TEXT NOT NULL DEFAULT 'v1.0-draft',
    label_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'pdf_extracted', 'ai_generated', 'revised')) DEFAULT 'ai_generated',
    pdf_watermarked BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Curated Statutory Compliance Rules Catalog
CREATE TABLE IF NOT EXISTS public.compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code TEXT NOT NULL UNIQUE,
    jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('India', 'USA', 'EU', 'Global')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source_reference TEXT NOT NULL,
    source_url TEXT NOT NULL,
    applicability TEXT NOT NULL DEFAULT 'all_devices',
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'mandatory', 'advisory')) DEFAULT 'mandatory',
    verification_status TEXT NOT NULL DEFAULT 'verified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Compliance Validation Reports
CREATE TABLE IF NOT EXISTS public.compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.label_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination_market TEXT NOT NULL CHECK (destination_market IN ('India', 'USA', 'EU')),
    total_checks INT NOT NULL DEFAULT 0,
    passed_checks INT NOT NULL DEFAULT 0,
    failed_checks INT NOT NULL DEFAULT 0,
    needs_review_checks INT NOT NULL DEFAULT 0,
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_advisory TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Label Comparisons
CREATE TABLE IF NOT EXISTS public.label_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.label_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    base_label_name TEXT NOT NULL,
    target_label_name TEXT NOT NULL,
    field_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    text_diff TEXT,
    critical_differences INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_label_versions_project_id ON public.label_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_jurisdiction ON public.compliance_rules(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_project_id ON public.compliance_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_label_comparisons_project_id ON public.label_comparisons(project_id);

-- Row Level Security
ALTER TABLE public.label_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_comparisons ENABLE ROW LEVEL SECURITY;

-- Compliance Rules: Public read for authenticated users
CREATE POLICY "Authenticated users can read compliance rules"
    ON public.compliance_rules FOR SELECT
    TO authenticated
    USING (true);

-- Label Versions RLS
CREATE POLICY "Users can view own label versions"
    ON public.label_versions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own label versions"
    ON public.label_versions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Compliance Reports RLS
CREATE POLICY "Users can view own compliance reports"
    ON public.compliance_reports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own compliance reports"
    ON public.compliance_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Label Comparisons RLS
CREATE POLICY "Users can view own label comparisons"
    ON public.label_comparisons FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own label comparisons"
    ON public.label_comparisons FOR INSERT
    WITH CHECK (auth.uid() = user_id);
