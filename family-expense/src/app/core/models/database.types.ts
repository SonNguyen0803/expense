export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          theme: 'light' | 'dark' | 'system'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          theme?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          theme?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
      }
      families: {
        Row: {
          id: string
          name: string
          owner_id: string
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string
          display_name: string
          role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id: string
          display_name: string
          role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          user_id?: string
          display_name?: string
          role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          family_id: string | null
          name: string
          icon: string
          type: 'INCOME' | 'EXPENSE'
          color: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id?: string | null
          name: string
          icon?: string
          type: 'INCOME' | 'EXPENSE'
          color?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string | null
          name?: string
          icon?: string
          type?: 'INCOME' | 'EXPENSE'
          color?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          family_id: string
          category_id: string
          member_id: string
          type: 'INCOME' | 'EXPENSE'
          amount: string
          note: string | null
          transaction_date: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          category_id: string
          member_id: string
          type: 'INCOME' | 'EXPENSE'
          amount: string
          note?: string | null
          transaction_date?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          category_id?: string
          member_id?: string
          type?: 'INCOME' | 'EXPENSE'
          amount?: string
          note?: string | null
          transaction_date?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          family_id: string
          category_id: string
          month: string
          amount: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          category_id: string
          month: string
          amount: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          category_id?: string
          month?: string
          amount?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_family_member: {
        Args: { check_family_id: string }
        Returns: boolean
      }
      is_family_admin: {
        Args: { check_family_id: string }
        Returns: boolean
      }
      is_family_owner: {
        Args: { check_family_id: string }
        Returns: boolean
      }
      can_modify_transaction: {
        Args: { transaction_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}