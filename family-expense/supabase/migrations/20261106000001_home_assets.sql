-- Migration: Home Assets Management Module (Quản lý tài sản trong nhà)
-- Tables: home_assets, asset_maintenances

-- 1. Create home_assets table
CREATE TABLE IF NOT EXISTS public.home_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('ELECTRONICS', 'APPLIANCES', 'FURNITURE', 'VEHICLES', 'KITCHEN', 'VALUABLES', 'OTHER')),
    room_location TEXT NOT NULL CHECK (room_location IN ('LIVING_ROOM', 'KITCHEN', 'BEDROOM_MASTER', 'BEDROOM_KIDS', 'WORK_ROOM', 'BALCONY', 'GARAGE', 'STORAGE', 'OTHER')),
    purchase_date DATE,
    purchase_price NUMERIC(15,2) DEFAULT 0,
    current_value NUMERIC(15,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'NEEDS_MAINTENANCE', 'UNDER_REPAIR', 'BROKEN', 'DISPOSED')),
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    vendor TEXT,
    warranty_months INT DEFAULT 0,
    warranty_end_date DATE,
    maintenance_period_months INT DEFAULT 0,
    next_maintenance_date DATE,
    assigned_to TEXT,
    image_url TEXT,
    notes TEXT,
    maintenances_count INT DEFAULT 0,
    total_maintenance_cost NUMERIC DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create asset_maintenances table (Lịch sử bảo dưỡng / sửa chữa)
CREATE TABLE IF NOT EXISTS public.asset_maintenances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.home_assets(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PERIODIC', 'REPAIR', 'REPLACEMENT', 'INSPECTION')),
    maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cost NUMERIC(15,2) DEFAULT 0,
    service_provider TEXT,
    technician_contact TEXT,
    notes TEXT,
    next_maintenance_date DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_home_assets_family ON public.home_assets(family_id);
CREATE INDEX IF NOT EXISTS idx_home_assets_category ON public.home_assets(category);
CREATE INDEX IF NOT EXISTS idx_home_assets_room ON public.home_assets(room_location);
CREATE INDEX IF NOT EXISTS idx_home_assets_status ON public.home_assets(status);
CREATE INDEX IF NOT EXISTS idx_asset_maintenances_asset ON public.asset_maintenances(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenances_family ON public.asset_maintenances(family_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenances_date ON public.asset_maintenances(maintenance_date DESC);

-- Enable RLS
ALTER TABLE public.home_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenances ENABLE ROW LEVEL SECURITY;

-- Policies for home_assets
CREATE POLICY "home_assets_select"
    ON public.home_assets FOR SELECT
    TO authenticated
    USING (is_family_member(family_id));

CREATE POLICY "home_assets_insert"
    ON public.home_assets FOR INSERT
    TO authenticated
    WITH CHECK (((family_id IS NOT NULL) AND is_family_member(family_id)));

CREATE POLICY "home_assets_update"
    ON public.home_assets FOR UPDATE
    TO authenticated
    USING (((family_id IS NOT NULL) AND is_family_member(family_id)));

CREATE POLICY "home_assets_delete"
    ON public.home_assets FOR DELETE
    TO authenticated
    USING (((family_id IS NOT NULL) AND is_family_admin(family_id)));

-- Policies for asset_maintenances
CREATE POLICY "asset_maintenances_select"
    ON public.asset_maintenances FOR SELECT
    TO authenticated
    USING (is_family_member(family_id));

CREATE POLICY "asset_maintenances_insert"
    ON public.asset_maintenances FOR INSERT
    TO authenticated
    WITH CHECK (((family_id IS NOT NULL) AND is_family_member(family_id)));

CREATE POLICY "asset_maintenances_update"
    ON public.asset_maintenances FOR UPDATE
    TO authenticated
    USING (((family_id IS NOT NULL) AND is_family_member(family_id)));

CREATE POLICY "asset_maintenances_delete"
    ON public.asset_maintenances FOR DELETE
    TO authenticated
    USING (((family_id IS NOT NULL) AND is_family_admin(family_id)));
