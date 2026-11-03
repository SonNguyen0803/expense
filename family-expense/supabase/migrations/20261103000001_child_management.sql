-- Migration: Child Management Module (Theo dõi sự phát triển của trẻ)
-- Tables: children, child_growth_records, child_milestones

-- 1. Create children table
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('BOY', 'GIRL')),
    birth_date DATE NOT NULL,
    avatar_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create child_growth_records table
CREATE TABLE IF NOT EXISTS public.child_growth_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    height NUMERIC(5,2) NOT NULL CHECK (height > 0),
    weight NUMERIC(5,2) NOT NULL CHECK (weight > 0),
    head_circumference NUMERIC(5,2) CHECK (head_circumference > 0),
    note TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create child_milestones table
CREATE TABLE IF NOT EXISTS public.child_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('MOTOR', 'LANGUAGE', 'COGNITIVE', 'SOCIAL', 'OTHER')),
    title TEXT NOT NULL,
    description TEXT,
    target_age_months INT,
    achieved BOOLEAN DEFAULT FALSE,
    achieved_date DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_children_family ON public.children(family_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_child ON public.child_growth_records(child_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_family ON public.child_growth_records(family_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_date ON public.child_growth_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_child_milestones_child ON public.child_milestones(child_id);
CREATE INDEX IF NOT EXISTS idx_child_milestones_family ON public.child_milestones(family_id);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for children
CREATE POLICY "Users can view children in their family"
    ON public.children FOR SELECT
    USING (is_family_member(family_id));

CREATE POLICY "Users can insert children in their family"
    ON public.children FOR INSERT
    WITH CHECK (is_family_member(family_id));

CREATE POLICY "Users can update children in their family"
    ON public.children FOR UPDATE
    USING (is_family_member(family_id));

CREATE POLICY "Users can delete children in their family"
    ON public.children FOR DELETE
    USING (is_family_member(family_id));

-- RLS Policies for child_growth_records
CREATE POLICY "Users can view child_growth_records in their family"
    ON public.child_growth_records FOR SELECT
    USING (is_family_member(family_id));

CREATE POLICY "Users can insert child_growth_records in their family"
    ON public.child_growth_records FOR INSERT
    WITH CHECK (is_family_member(family_id));

CREATE POLICY "Users can update child_growth_records in their family"
    ON public.child_growth_records FOR UPDATE
    USING (is_family_member(family_id));

CREATE POLICY "Users can delete child_growth_records in their family"
    ON public.child_growth_records FOR DELETE
    USING (is_family_member(family_id));

-- RLS Policies for child_milestones
CREATE POLICY "Users can view child_milestones in their family"
    ON public.child_milestones FOR SELECT
    USING (is_family_member(family_id));

CREATE POLICY "Users can insert child_milestones in their family"
    ON public.child_milestones FOR INSERT
    WITH CHECK (is_family_member(family_id));

CREATE POLICY "Users can update child_milestones in their family"
    ON public.child_milestones FOR UPDATE
    USING (is_family_member(family_id));

CREATE POLICY "Users can delete child_milestones in their family"
    ON public.child_milestones FOR DELETE
    USING (is_family_member(family_id));
