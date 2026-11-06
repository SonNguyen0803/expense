-- Migration: Shopping List / Items to Buy Module (Ghi chú sản phẩm cần mua)
-- Tables: shopping_items

CREATE TABLE IF NOT EXISTS public.shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'GROCERY' CHECK (category IN ('GROCERY', 'HOME_SUPPLIES', 'BABY_KIDS', 'ELECTRONICS', 'CLOTHING', 'PERSONAL_CARE', 'OTHER')),
    quantity NUMERIC(10,2) DEFAULT 1 CHECK (quantity > 0),
    unit TEXT DEFAULT 'món',
    estimated_price NUMERIC(15,2) DEFAULT 0,
    actual_price NUMERIC(15,2),
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('URGENT', 'HIGH', 'NORMAL', 'LOW')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'BUYING', 'PURCHASED', 'CANCELLED')),
    store_location TEXT,
    target_date DATE,
    assigned_to TEXT,
    notes TEXT,
    purchased_at TIMESTAMPTZ,
    purchased_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopping_items_family ON public.shopping_items(family_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_status ON public.shopping_items(status);
CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON public.shopping_items(category);
CREATE INDEX IF NOT EXISTS idx_shopping_items_priority ON public.shopping_items(priority);
CREATE INDEX IF NOT EXISTS idx_shopping_items_date ON public.shopping_items(created_at DESC);

-- Enable RLS
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "shopping_items_select"
    ON public.shopping_items FOR SELECT
    TO authenticated
    USING (is_family_member(family_id));

CREATE POLICY "shopping_items_insert"
    ON public.shopping_items FOR INSERT
    TO authenticated
    WITH CHECK (((family_id IS NOT NULL) AND is_family_member(family_id)));

CREATE POLICY "shopping_items_update"
    ON public.shopping_items FOR UPDATE
    TO authenticated
    USING (((family_id IS NOT NULL) AND is_family_member(family_id)));

CREATE POLICY "shopping_items_delete"
    ON public.shopping_items FOR DELETE
    TO authenticated
    USING (((family_id IS NOT NULL) AND is_family_admin(family_id)));
