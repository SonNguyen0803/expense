import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { ShoppingItem, ShoppingItemStatus, ShoppingSummary, ShoppingCategory } from '../models';
import { getDefaultSampleShoppingItems } from '../utils/shopping.util';

@Injectable({
  providedIn: 'root'
})
export class ShoppingRepository {
  private itemsSignal = signal<ShoppingItem[]>([]);
  private loadingSignal = signal<boolean>(false);

  // Readonly signals
  items = this.itemsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  // Computed summary
  summary = computed<ShoppingSummary>(() => {
    const all = this.itemsSignal();
    let pendingCount = 0;
    let buyingCount = 0;
    let purchasedCount = 0;
    let cancelledCount = 0;
    let totalEstimated = 0;
    let totalActualSpent = 0;
    let urgentCount = 0;

    for (const item of all) {
      if (item.status === 'PENDING') {
        pendingCount++;
        totalEstimated += Number(item.estimated_price || 0);
      } else if (item.status === 'BUYING') {
        buyingCount++;
        totalEstimated += Number(item.estimated_price || 0);
      } else if (item.status === 'PURCHASED') {
        purchasedCount++;
        totalActualSpent += Number(item.actual_price !== undefined && item.actual_price !== null ? item.actual_price : item.estimated_price || 0);
      } else if (item.status === 'CANCELLED') {
        cancelledCount++;
      }

      if (item.priority === 'URGENT' && (item.status === 'PENDING' || item.status === 'BUYING')) {
        urgentCount++;
      }
    }

    return {
      totalItems: all.length,
      pendingCount,
      buyingCount,
      purchasedCount,
      cancelledCount,
      totalEstimated,
      totalActualSpent,
      urgentCount
    };
  });

  // Filtered views
  pendingItems = computed(() => this.itemsSignal().filter(i => i.status === 'PENDING'));
  buyingItems = computed(() => this.itemsSignal().filter(i => i.status === 'BUYING'));
  purchasedItems = computed(() => this.itemsSignal().filter(i => i.status === 'PURCHASED'));

  constructor(private supabase: SupabaseService) {}

  private getLocalKey(familyId: string): string {
    return `family_shopping_items_${familyId}`;
  }

  // ==========================================
  // Load Items
  // ==========================================

  async loadItems(familyId: string): Promise<ShoppingItem[]> {
    this.loadingSignal.set(true);
    try {
      let data: ShoppingItem[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('shopping_items')
          .select('*')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false });

        if (!res.error && res.data) {
          data = res.data;
        }
      } catch (err) {
        console.warn('Supabase shopping_items table not available, using local cache:', err);
      }

      if (!data) {
        const cached = localStorage.getItem(this.getLocalKey(familyId));
        if (cached) {
          data = JSON.parse(cached);
        } else {
          data = getDefaultSampleShoppingItems(familyId);
          localStorage.setItem(this.getLocalKey(familyId), JSON.stringify(data));
        }
      } else {
        localStorage.setItem(this.getLocalKey(familyId), JSON.stringify(data));
      }

      this.itemsSignal.set(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading shopping items:', error);
      return [];
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // ==========================================
  // Quick Add Item (1-click from top bar)
  // ==========================================

  async quickAddItem(familyId: string, title: string, category: ShoppingCategory = 'GROCERY'): Promise<ShoppingItem | null> {
    if (!title.trim()) return null;
    return this.createItem({
      family_id: familyId,
      title: title.trim(),
      category,
      quantity: 1,
      unit: 'món',
      estimated_price: 0,
      priority: 'NORMAL',
      status: 'PENDING'
    });
  }

  // ==========================================
  // Create Item
  // ==========================================

  async createItem(item: Partial<ShoppingItem> & { family_id: string; title: string }): Promise<ShoppingItem | null> {
    this.loadingSignal.set(true);
    try {
      const now = new Date().toISOString();
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        family_id: item.family_id,
        title: item.title.trim(),
        category: item.category || 'GROCERY',
        quantity: item.quantity ? Number(item.quantity) : 1,
        unit: item.unit?.trim() || 'món',
        estimated_price: item.estimated_price ? Number(item.estimated_price) : 0,
        actual_price: item.actual_price ? Number(item.actual_price) : null,
        priority: item.priority || 'NORMAL',
        status: item.status || 'PENDING',
        store_location: item.store_location?.trim() || null,
        target_date: item.target_date || null,
        assigned_to: item.assigned_to?.trim() || null,
        notes: item.notes?.trim() || null,
        purchased_at: item.status === 'PURCHASED' ? now : null,
        created_at: now,
        updated_at: now
      };

      try {
        const res = await (this.supabase.db as any)
          .from('shopping_items')
          .insert([newItem])
          .select()
          .single();

        if (!res.error && res.data) {
          newItem.id = res.data.id;
        }
      } catch (err) {
        console.warn('Supabase insert shopping_item failed, using local storage:', err);
      }

      const updated = [newItem, ...this.itemsSignal()];
      this.itemsSignal.set(updated);
      localStorage.setItem(this.getLocalKey(item.family_id), JSON.stringify(updated));

      return newItem;
    } catch (error) {
      console.error('Error creating shopping item:', error);
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // ==========================================
  // Change Status (PENDING -> BUYING -> PURCHASED -> CANCELLED)
  // ==========================================

  async changeStatus(id: string, familyId: string, newStatus: ShoppingItemStatus, actualPrice?: number): Promise<boolean> {
    const item = this.itemsSignal().find(i => i.id === id);
    if (!item) return false;

    const changes: Partial<ShoppingItem> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'PURCHASED') {
      changes.purchased_at = new Date().toISOString();
      if (actualPrice !== undefined) {
        changes.actual_price = Number(actualPrice);
      } else if (item.actual_price === null || item.actual_price === undefined) {
        changes.actual_price = item.estimated_price;
      }
    } else {
      changes.purchased_at = null;
    }

    return this.updateItem(id, familyId, changes);
  }

  // Toggle quick complete checkbox
  async togglePurchased(id: string, familyId: string): Promise<boolean> {
    const item = this.itemsSignal().find(i => i.id === id);
    if (!item) return false;

    const newStatus: ShoppingItemStatus = item.status === 'PURCHASED' ? 'PENDING' : 'PURCHASED';
    return this.changeStatus(id, familyId, newStatus);
  }

  // ==========================================
  // Update Item
  // ==========================================

  async updateItem(id: string, familyId: string, changes: Partial<ShoppingItem>): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const updatedFields = {
        ...changes,
        updated_at: now
      };

      try {
        await (this.supabase.db as any)
          .from('shopping_items')
          .update(updatedFields)
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update failed, continuing with local storage:', err);
      }

      const updatedList = this.itemsSignal().map(item => {
        if (item.id === id) {
          return { ...item, ...updatedFields };
        }
        return item;
      });

      this.itemsSignal.set(updatedList);
      localStorage.setItem(this.getLocalKey(familyId), JSON.stringify(updatedList));
      return true;
    } catch (error) {
      console.error('Error updating shopping item:', error);
      return false;
    }
  }

  // ==========================================
  // Delete Item
  // ==========================================

  async deleteItem(id: string, familyId: string): Promise<boolean> {
    try {
      try {
        await (this.supabase.db as any)
          .from('shopping_items')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase delete failed, continuing with local storage:', err);
      }

      const updated = this.itemsSignal().filter(i => i.id !== id);
      this.itemsSignal.set(updated);
      localStorage.setItem(this.getLocalKey(familyId), JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      return false;
    }
  }

  // ==========================================
  // Clear Purchased Items (Dọn dẹp danh sách)
  // ==========================================

  async clearPurchased(familyId: string): Promise<boolean> {
    try {
      const purchased = this.itemsSignal().filter(i => i.status === 'PURCHASED');
      for (const item of purchased) {
        try {
          await (this.supabase.db as any)
            .from('shopping_items')
            .delete()
            .eq('id', item.id);
        } catch (e) {}
      }

      const updated = this.itemsSignal().filter(i => i.status !== 'PURCHASED');
      this.itemsSignal.set(updated);
      localStorage.setItem(this.getLocalKey(familyId), JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Error clearing purchased items:', error);
      return false;
    }
  }
}
