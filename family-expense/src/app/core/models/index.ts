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

// ===================================
// Home Asset Management Models
// ===================================

export type AssetCategory =
  | 'ELECTRONICS'
  | 'APPLIANCES'
  | 'FURNITURE'
  | 'VEHICLES'
  | 'KITCHEN'
  | 'VALUABLES'
  | 'OTHER';

export type RoomLocation =
  | 'LIVING_ROOM'
  | 'KITCHEN'
  | 'BEDROOM_MASTER'
  | 'BEDROOM_KIDS'
  | 'WORK_ROOM'
  | 'BALCONY'
  | 'GARAGE'
  | 'STORAGE'
  | 'OTHER';

export type AssetStatus =
  | 'ACTIVE'
  | 'NEEDS_MAINTENANCE'
  | 'UNDER_REPAIR'
  | 'BROKEN'
  | 'DISPOSED';

export interface HomeAsset {
  id: string;
  family_id: string;
  name: string;
  category: AssetCategory;
  room_location: RoomLocation;
  purchase_date?: string | null; // YYYY-MM-DD
  purchase_price?: number;
  current_value?: number;
  status: AssetStatus;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  vendor?: string | null;
  warranty_months?: number;
  warranty_end_date?: string | null; // YYYY-MM-DD
  maintenance_period_months?: number; // e.g. 6 (every 6 months)
  next_maintenance_date?: string | null; // YYYY-MM-DD
  assigned_to?: string | null;
  image_url?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Computed/joined fields
  maintenances_count?: number;
  total_maintenance_cost?: number;
}

export type MaintenanceType = 'PERIODIC' | 'REPAIR' | 'REPLACEMENT' | 'INSPECTION';

export interface AssetMaintenance {
  id: string;
  asset_id: string;
  family_id: string;
  title: string;
  type: MaintenanceType;
  maintenance_date: string; // YYYY-MM-DD
  cost: number;
  service_provider?: string | null;
  technician_contact?: string | null;
  notes?: string | null;
  next_maintenance_date?: string | null; // YYYY-MM-DD
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Joined details
  asset_name?: string;
  asset_category?: AssetCategory;
}

export interface AssetStatsSummary {
  totalAssets: number;
  totalPurchaseCost: number;
  totalCurrentValue: number;
  totalMaintenanceCost: number;
  expiringWarrantyCount: number;
  activeCount: number;
  needsMaintenanceCount: number;
  brokenCount: number;
}


