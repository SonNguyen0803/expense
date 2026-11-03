export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  owner_id: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export type FamilyRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  display_name: string;
  role: FamilyRole;
  created_at: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  family_id: string | null;
  name: string;
  icon: string;
  type: TransactionType;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  family_id: string;
  category_id: string;
  member_id: string;
  type: TransactionType;
  amount: string;
  note: string | null;
  transaction_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithDetails extends Transaction {
  category?: Category;
  member?: FamilyMember;
}

export interface Budget {
  id: string;
  family_id: string;
  category_id: string;
  month: string;
  amount: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithDetails extends Budget {
  category?: Category;
  spent?: string;
  percentage?: number;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  todayExpense: number;
  monthExpense: number;
  monthIncome: number;
  lastMonthComparison: number;
}

export interface CategoryExpense {
  category: Category;
  total: number;
  percentage: number;
}

// ========================
// Child Management Models
// ========================

export type ChildGender = 'BOY' | 'GIRL';

export interface Child {
  id: string;
  family_id: string;
  name: string;
  gender: ChildGender;
  birth_date: string; // YYYY-MM-DD
  avatar_url?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrowthRecord {
  id: string;
  child_id: string;
  family_id: string;
  record_date: string; // YYYY-MM-DD
  height: number; // cm
  weight: number; // kg
  head_circumference?: number | null; // cm
  note?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type MilestoneCategory = 'MOTOR' | 'LANGUAGE' | 'COGNITIVE' | 'SOCIAL' | 'OTHER';

export interface ChildMilestone {
  id: string;
  child_id: string;
  family_id: string;
  category: MilestoneCategory;
  title: string;
  description?: string | null;
  target_age_months?: number | null;
  achieved: boolean;
  achieved_date?: string | null;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

// ===================================
// Kids Task & Rewards Module Models
// ===================================

export interface TaskCategory {
  id: string;
  family_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type TaskScheduleType = 'ONCE' | 'DAILY' | 'WEEKLY' | 'CUSTOM_DAYS';

export interface KidsTask {
  id: string;
  family_id: string;
  child_id?: string | null; // null = all children in family
  category_id?: string | null;
  title: string;
  description?: string | null;
  points: number;
  schedule_type: TaskScheduleType;
  schedule_days?: string[] | null;
  due_date?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Joined details
  category?: TaskCategory | null;
  child?: Child | null;
}

export type TaskSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TaskSubmission {
  id: string;
  task_id: string;
  child_id: string;
  family_id: string;
  submission_date: string; // YYYY-MM-DD
  status: TaskSubmissionStatus;
  child_note?: string | null;
  feedback?: string | null;
  points_awarded: number;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;

  // Joined details
  task?: KidsTask | null;
  child?: Child | null;
}

export interface RewardItem {
  id: string;
  family_id: string;
  title: string;
  description?: string | null;
  icon: string;
  points_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RewardRedemptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';

export interface RewardRedemption {
  id: string;
  reward_id: string;
  child_id: string;
  family_id: string;
  points_spent: number;
  status: RewardRedemptionStatus;
  request_date: string;
  note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;

  // Joined details
  reward?: RewardItem | null;
  child?: Child | null;
}

export type PointTransactionType = 'TASK_REWARD' | 'REWARD_REDEEM' | 'BONUS' | 'PENALTY';

export interface PointTransaction {
  id: string;
  child_id: string;
  family_id: string;
  amount: number; // positive = earned, negative = spent
  type: PointTransactionType;
  reference_id?: string | null;
  description: string;
  created_at: string;
}

export interface ChildAchievement {
  id: string;
  child_id: string;
  family_id: string;
  badge_key: string;
  unlocked_at: string;
}

export interface ChildPointSummary {
  childId: string;
  childName: string;
  childGender: ChildGender;
  currentPoints: number;
  totalEarned: number;
  totalSpent: number;
  completedTasksCount: number;
  level: number;
  levelTitle: string;
  badgesCount: number;
}

