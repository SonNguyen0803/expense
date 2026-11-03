-- Migration: Kids Task & Rewards Module (Nhiệm vụ & Phần thưởng cho trẻ)
-- Tables: task_categories, kids_tasks, task_submissions, reward_items, reward_redemptions, point_transactions, child_achievements

-- 1. Task Categories
CREATE TABLE IF NOT EXISTS public.task_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📝',
    color TEXT DEFAULT '#3B82F6',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kids Tasks
CREATE TABLE IF NOT EXISTS public.kids_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE, -- NULL means available to all children
    category_id UUID REFERENCES public.task_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    points INT NOT NULL DEFAULT 10 CHECK (points > 0),
    schedule_type TEXT NOT NULL DEFAULT 'DAILY' CHECK (schedule_type IN ('ONCE', 'DAILY', 'WEEKLY', 'CUSTOM_DAYS')),
    schedule_days TEXT[], -- e.g. ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    due_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Task Submissions & Approvals
CREATE TABLE IF NOT EXISTS public.task_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.kids_tasks(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    child_note TEXT,
    feedback TEXT,
    points_awarded INT NOT NULL DEFAULT 0,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reward Store Items
CREATE TABLE IF NOT EXISTS public.reward_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT '🎁',
    points_cost INT NOT NULL CHECK (points_cost > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reward Redemptions
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_id UUID NOT NULL REFERENCES public.reward_items(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    points_spent INT NOT NULL CHECK (points_spent > 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED')),
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Point Transactions (History / Ledger)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    amount INT NOT NULL, -- Positive for earned, negative for spent
    type TEXT NOT NULL CHECK (type IN ('TASK_REWARD', 'REWARD_REDEEM', 'BONUS', 'PENALTY')),
    reference_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Child Achievements
CREATE TABLE IF NOT EXISTS public.child_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    badge_key TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id, badge_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kids_tasks_family ON public.kids_tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_kids_tasks_child ON public.kids_tasks(child_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task ON public.task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_child ON public.task_submissions(child_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_rewards_family ON public.reward_items(family_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_child ON public.reward_redemptions(child_id);
CREATE INDEX IF NOT EXISTS idx_points_child ON public.point_transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_achievements_child ON public.child_achievements(child_id);

-- Enable RLS
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_achievements ENABLE ROW LEVEL SECURITY;

-- Policies (Family Members can access)
CREATE POLICY "Family members can view task categories"
    ON public.task_categories FOR SELECT
    USING (is_default = TRUE OR is_family_member(family_id));

CREATE POLICY "Family members can manage task categories"
    ON public.task_categories FOR ALL
    USING (is_family_member(family_id));

CREATE POLICY "Family members can manage kids tasks"
    ON public.kids_tasks FOR ALL
    USING (is_family_member(family_id));

CREATE POLICY "Family members can manage task submissions"
    ON public.task_submissions FOR ALL
    USING (is_family_member(family_id));

CREATE POLICY "Family members can manage rewards"
    ON public.reward_items FOR ALL
    USING (is_family_member(family_id));

CREATE POLICY "Family members can manage redemptions"
    ON public.reward_redemptions FOR ALL
    USING (is_family_member(family_id));

CREATE POLICY "Family members can manage point transactions"
    ON public.point_transactions FOR ALL
    USING (is_family_member(family_id));

CREATE POLICY "Family members can manage child achievements"
    ON public.child_achievements FOR ALL
    USING (is_family_member(family_id));
