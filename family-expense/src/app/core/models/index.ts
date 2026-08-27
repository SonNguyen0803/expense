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