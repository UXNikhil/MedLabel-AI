-- ==============================================================================
-- MedLabel AI — Stage 1 Database Schema with Row Level Security (RLS)
-- Destination Markets: India (CDSCO), USA (FDA 21 CFR Part 801), EU (MDR 2017/745)
-- Note: Prototype application for hackathon validation; not official certification.
-- ==============================================================================

-- 1. Profiles & Roles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('editor', 'reviewer', 'admin')) DEFAULT 'editor',
    organization TEXT DEFAULT 'MedLabel AI Organization',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Medical Devices Table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    model_number TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    country_of_origin TEXT NOT NULL, -- e.g. "Germany", "United States", "India", "Japan"
    intended_market TEXT NOT NULL CHECK (intended_market IN ('India', 'USA', 'EU', 'Global')),
    
    -- Conditional Importer Information (Crucial when origin != intended market, e.g. Germany -> India import)
    importer_name TEXT,
    importer_address TEXT,
    
    -- Traceability and Regulatory Identifiers
    lot_number TEXT,
    serial_number TEXT,
    manufacturing_date DATE,
    expiry_date DATE,
    storage_conditions TEXT,
    warnings_cautions TEXT,
    udi_di TEXT, -- Unique Device Identifier - Device Identifier
    udi_pi TEXT, -- Unique Device Identifier - Production Identifier
    
    -- Packaging and Presentation
    packaging_level TEXT NOT NULL CHECK (packaging_level IN ('primary', 'secondary', 'shipper')) DEFAULT 'primary',
    language TEXT NOT NULL DEFAULT 'en',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Label Projects Table
CREATE TABLE IF NOT EXISTS public.label_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    destination_market TEXT NOT NULL CHECK (destination_market IN ('India', 'USA', 'EU')),
    packaging_level TEXT NOT NULL CHECK (packaging_level IN ('primary', 'secondary', 'shipper')) DEFAULT 'primary',
    version TEXT NOT NULL DEFAULT 'v1.0-draft',
    status TEXT NOT NULL CHECK (status IN ('draft', 'in_review', 'approved', 'rejected')) DEFAULT 'draft',
    notes TEXT,
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_intended_market ON public.devices(intended_market);
CREATE INDEX IF NOT EXISTS idx_label_projects_user_id ON public.label_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_label_projects_device_id ON public.label_projects(device_id);
CREATE INDEX IF NOT EXISTS idx_label_projects_market ON public.label_projects(destination_market);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_devices_updated_at ON public.devices;
CREATE TRIGGER set_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_label_projects_updated_at ON public.label_projects;
CREATE TRIGGER set_label_projects_updated_at
    BEFORE UPDATE ON public.label_projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to automatically create profile entry when new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'editor')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation: Users manage their own records.
-- Reviewers and Admins can view projects in review/approved.
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_projects ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Devices Policies
CREATE POLICY "Users can view own devices"
    ON public.devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
    ON public.devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
    ON public.devices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
    ON public.devices FOR DELETE
    USING (auth.uid() = user_id);

-- Label Projects Policies
CREATE POLICY "Users can view own label projects"
    ON public.label_projects FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('reviewer', 'admin')
        )
    );

CREATE POLICY "Users can insert own label projects"
    ON public.label_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own label projects"
    ON public.label_projects FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('reviewer', 'admin')
        )
    );

CREATE POLICY "Users can delete own label projects"
    ON public.label_projects FOR DELETE
    USING (auth.uid() = user_id);
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
