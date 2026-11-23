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
