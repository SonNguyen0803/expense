import { Injectable, signal } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Transaction, TransactionWithDetails, TransactionType } from '../models';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  memberId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionRepository {
  private transactions = signal<TransactionWithDetails[]>([]);
  private loading = signal<boolean>(false);
  private realtimeChannel: RealtimeChannel | null = null;

  allTransactions = this.transactions.asReadonly();
  isLoading = this.loading.asReadonly();

  constructor(private supabase: SupabaseService) {}

  async loadTransactions(familyId: string, filters?: TransactionFilters) {
    this.loading.set(true);
    try {
      let query = (this.supabase.db as any)
        .from('transactions')
        .select(`
          *,
          category:categories(*),
          member:family_members(*)
        `)
        .eq('family_id', familyId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters?.memberId) {
        query = query.eq('member_id', filters.memberId);
      }

      if (filters?.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      let result = (data || []) as any[];

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter((t: any) =>
          t.note?.toLowerCase().includes(searchLower) ||
          t.category?.name.toLowerCase().includes(searchLower)
        );
      }

      this.transactions.set(result);
      return result;
    } catch (error) {
      console.error('Error loading transactions:', error);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await (this.supabase.db as any)
        .from('transactions')
        .insert({
          family_id: transaction.family_id,
          amount: transaction.amount,
          type: transaction.type,
          category_id: transaction.category_id,
          member_id: transaction.member_id,
          transaction_date: transaction.transaction_date,
          note: transaction.note || undefined,
          created_by: transaction.created_by
        })
        .select(`
          *,
          category:categories(*),
          member:family_members(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async getTransactionById(id: string) {
    try {
      const { data, error } = await (this.supabase.db as any)
        .from('transactions')
        .select(`
          *,
          category:categories(*),
          member:family_members(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: string, updates: any) {
    try {
      const { data, error } = await (this.supabase.db as any)
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:categories(*),
          member:family_members(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string) {
    try {
      const { error } = await (this.supabase.db as any)
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  subscribeToTransactions(familyId: string, callback: (transaction: Transaction) => void) {
    this.realtimeChannel = this.supabase.db
      .channel(`transactions:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `family_id=eq.${familyId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            callback(payload.new as Transaction);
          } else if (payload.eventType === 'UPDATE') {
            callback(payload.new as Transaction);
          } else if (payload.eventType === 'DELETE') {
            this.loadTransactions(familyId);
          }
        }
      )
      .subscribe();

    return this.realtimeChannel;
  }

  unsubscribeFromTransactions() {
    if (this.realtimeChannel) {
      this.supabase.db.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  async getMonthlyStats(familyId: string, year: number, month: number) {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await (this.supabase.db as any)
        .from('transactions')
        .select('type, amount')
        .eq('family_id', familyId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) throw error;

      const stats = {
        income: 0,
        expense: 0
      };

      data?.forEach((t: any) => {
        const amount = parseFloat(t.amount);
        if (t.type === 'INCOME') {
          stats.income += amount;
        } else {
          stats.expense += amount;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting monthly stats:', error);
      throw error;
    }
  }
}