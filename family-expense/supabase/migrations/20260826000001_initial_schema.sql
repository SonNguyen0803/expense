-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create families table
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'VND',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(family_id, user_id)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📦',
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    color TEXT DEFAULT '#6B7280',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    note TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(family_id, category_id, month)
);

-- Create indexes
CREATE INDEX idx_families_owner ON public.families(owner_id);
CREATE INDEX idx_family_members_family ON public.family_members(family_id);
CREATE INDEX idx_family_members_user ON public.family_members(user_id);
CREATE INDEX idx_categories_family ON public.categories(family_id);
CREATE INDEX idx_categories_default ON public.categories(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_transactions_family ON public.transactions(family_id);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_transactions_member ON public.transactions(member_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX idx_budgets_family ON public.budgets(family_id);
CREATE INDEX idx_budgets_month ON public.budgets(month);

-- Create helper functions for RLS
CREATE OR REPLACE FUNCTION public.is_family_member(check_family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = check_family_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_family_admin(check_family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = check_family_id
        AND user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_family_owner(check_family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = check_family_id
        AND user_id = auth.uid()
        AND role = 'OWNER'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_modify_transaction(transaction_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    trans_record RECORD;
    user_role TEXT;
BEGIN
    SELECT t.family_id, t.created_by INTO trans_record
    FROM public.transactions t
    WHERE t.id = transaction_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    SELECT fm.role INTO user_role
    FROM public.family_members fm
    WHERE fm.family_id = trans_record.family_id
    AND fm.user_id = auth.uid();
    
    IF user_role IN ('OWNER', 'ADMIN') THEN
        RETURN TRUE;
    END IF;
    
    IF user_role = 'MEMBER' AND trans_record.created_by = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for families
CREATE POLICY "Users can view families they are members of"
    ON public.families FOR SELECT
    USING (is_family_member(id));

CREATE POLICY "Only owners can update their families"
    ON public.families FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create families"
    ON public.families FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Only owners can delete their families"
    ON public.families FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for family_members
CREATE POLICY "Users can view members of their families"
    ON public.family_members FOR SELECT
    USING (is_family_member(family_id));

CREATE POLICY "Admins can insert family members"
    ON public.family_members FOR INSERT
    WITH CHECK (is_family_admin(family_id));

CREATE POLICY "Admins can update family members"
    ON public.family_members FOR UPDATE
    USING (is_family_admin(family_id));

CREATE POLICY "Admins can delete family members"
    ON public.family_members FOR DELETE
    USING (is_family_admin(family_id));

-- RLS Policies for categories
CREATE POLICY "Users can view categories of their families or default categories"
    ON public.categories FOR SELECT
    USING (is_default = TRUE OR is_family_member(family_id));

CREATE POLICY "Admins can create categories for their families"
    ON public.categories FOR INSERT
    WITH CHECK (is_family_admin(family_id));

CREATE POLICY "Admins can update categories of their families"
    ON public.categories FOR UPDATE
    USING (is_family_admin(family_id));

CREATE POLICY "Admins can delete categories of their families"
    ON public.categories FOR DELETE
    USING (is_family_admin(family_id));

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions of their families"
    ON public.transactions FOR SELECT
    USING (is_family_member(family_id));

CREATE POLICY "Members can create transactions for their families"
    ON public.transactions FOR INSERT
    WITH CHECK (
        is_family_member(family_id)
        AND EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_id = transactions.family_id
            AND user_id = auth.uid()
            AND role IN ('OWNER', 'ADMIN', 'MEMBER')
        )
    );

CREATE POLICY "Users can update their own transactions or admins can update any"
    ON public.transactions FOR UPDATE
    USING (can_modify_transaction(id));

CREATE POLICY "Users can delete their own transactions or admins can delete any"
    ON public.transactions FOR DELETE
    USING (can_modify_transaction(id));

-- RLS Policies for budgets
CREATE POLICY "Users can view budgets of their families"
    ON public.budgets FOR SELECT
    USING (is_family_member(family_id));

CREATE POLICY "Admins can create budgets for their families"
    ON public.budgets FOR INSERT
    WITH CHECK (is_family_admin(family_id));

CREATE POLICY "Admins can update budgets of their families"
    ON public.budgets FOR UPDATE
    USING (is_family_admin(family_id));

CREATE POLICY "Admins can delete budgets of their families"
    ON public.budgets FOR DELETE
    USING (is_family_admin(family_id));

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_families_updated_at
    BEFORE UPDATE ON public.families
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();