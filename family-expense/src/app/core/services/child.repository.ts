import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Child, GrowthRecord, ChildMilestone } from '../models';
import { getDefaultMilestones } from '../utils/child-growth.util';

@Injectable({
  providedIn: 'root'
})
export class ChildRepository {
  private childrenSignal = signal<Child[]>([]);
  private selectedChildSignal = signal<Child | null>(null);
  private recordsSignal = signal<GrowthRecord[]>([]);
  private milestonesSignal = signal<ChildMilestone[]>([]);
  private loadingSignal = signal<boolean>(false);

  // Readonly signals
  children = this.childrenSignal.asReadonly();
  selectedChild = this.selectedChildSignal.asReadonly();
  growthRecords = this.recordsSignal.asReadonly();
  milestones = this.milestonesSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  // Helper computed: latest growth record
  latestRecord = computed(() => {
    const records = this.recordsSignal();
    if (records.length === 0) return null;
    // Sort descending by date
    const sorted = [...records].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
    return sorted[0];
  });

  // Helper computed: previous growth record
  previousRecord = computed(() => {
    const records = this.recordsSignal();
    if (records.length < 2) return null;
    const sorted = [...records].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
    return sorted[1];
  });

  constructor(private supabase: SupabaseService) {}

  // Local storage backup keys for seamless operation
  private getLocalKey(type: string, id: string): string {
    return `family_child_${type}_${id}`;
  }

  // ==========================================
  // Children Management
  // ==========================================

  async loadChildren(familyId: string): Promise<Child[]> {
    this.loadingSignal.set(true);
    try {
      let data: Child[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('children')
          .select('*')
          .eq('family_id', familyId)
          .order('birth_date', { ascending: false });

        if (!res.error && res.data) {
          data = res.data;
        }
      } catch (err) {
        console.warn('Supabase children table not available, using local cache:', err);
      }

      // If Supabase failed or returned nothing, check localStorage
      if (!data) {
        const cached = localStorage.getItem(this.getLocalKey('children', familyId));
        data = cached ? JSON.parse(cached) : [];
      } else {
        localStorage.setItem(this.getLocalKey('children', familyId), JSON.stringify(data));
      }

      this.childrenSignal.set(data || []);

      // Auto select first child if current selectedChild is null or not in list
      const currentSelected = this.selectedChildSignal();
      if (data && data.length > 0) {
        const stillExists = currentSelected && data.some(c => c.id === currentSelected.id);
        if (!stillExists) {
          await this.selectChild(data[0]);
        } else if (currentSelected) {
          // Refresh selected child reference
          const fresh = data.find(c => c.id === currentSelected.id);
          if (fresh) this.selectedChildSignal.set(fresh);
        }
      } else {
        this.selectedChildSignal.set(null);
        this.recordsSignal.set([]);
        this.milestonesSignal.set([]);
      }

      return data || [];
    } catch (error) {
      console.error('Error loading children:', error);
      return [];
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async selectChild(child: Child | null) {
    this.selectedChildSignal.set(child);
    if (child) {
      await Promise.all([
        this.loadGrowthRecords(child.id, child.family_id),
        this.loadMilestones(child.id, child.family_id)
      ]);
    } else {
      this.recordsSignal.set([]);
      this.milestonesSignal.set([]);
    }
  }

  async createChild(childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>): Promise<Child> {
    this.loadingSignal.set(true);
    try {
      let created: Child | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('children')
          .insert({
            family_id: childData.family_id,
            name: childData.name,
            gender: childData.gender,
            birth_date: childData.birth_date,
            avatar_url: childData.avatar_url || null,
            notes: childData.notes || null,
            created_by: childData.created_by || null
          })
          .select()
          .single();

        if (!res.error && res.data) {
          created = res.data;
        }
      } catch (err) {
        console.warn('Failed to insert child in Supabase, using local fallback:', err);
      }

      if (!created) {
        created = {
          ...childData,
          id: 'child_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      // Update local storage
      const currentList = this.childrenSignal();
      const updatedList = [created, ...currentList];
      this.childrenSignal.set(updatedList);
      localStorage.setItem(this.getLocalKey('children', childData.family_id), JSON.stringify(updatedList));

      // Initialize default milestones for new child
      await this.initDefaultMilestones(created.id, created.family_id);

      // Select newly created child
      await this.selectChild(created);

      return created;
    } catch (error) {
      console.error('Error creating child:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateChild(id: string, updates: Partial<Child>): Promise<Child | null> {
    this.loadingSignal.set(true);
    try {
      let updated: Child | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('children')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!res.error && res.data) {
          updated = res.data;
        }
      } catch (err) {
        console.warn('Update in Supabase failed, using local update:', err);
      }

      const list = this.childrenSignal().map(c => {
        if (c.id === id) {
          const item = updated || { ...c, ...updates, updated_at: new Date().toISOString() };
          updated = item;
          return item;
        }
        return c;
      });

      this.childrenSignal.set(list);
      if (updated) {
        this.selectedChildSignal.set(updated);
        localStorage.setItem(this.getLocalKey('children', (updated as Child).family_id), JSON.stringify(list));
      }

      return updated;
    } catch (error) {
      console.error('Error updating child:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async deleteChild(id: string, familyId: string): Promise<void> {
    this.loadingSignal.set(true);
    try {
      try {
        await (this.supabase.db as any).from('children').delete().eq('id', id);
      } catch (err) {
        console.warn('Delete in Supabase failed:', err);
      }

      const list = this.childrenSignal().filter(c => c.id !== id);
      this.childrenSignal.set(list);
      localStorage.setItem(this.getLocalKey('children', familyId), JSON.stringify(list));

      if (list.length > 0) {
        await this.selectChild(list[0]);
      } else {
        await this.selectChild(null);
      }
    } catch (error) {
      console.error('Error deleting child:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // ==========================================
  // Growth Records Management
  // ==========================================

  async loadGrowthRecords(childId: string, familyId: string): Promise<GrowthRecord[]> {
    try {
      let data: GrowthRecord[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('child_growth_records')
          .select('*')
          .eq('child_id', childId)
          .order('record_date', { ascending: true });

        if (!res.error && res.data) {
          data = res.data.map((r: any) => ({
            ...r,
            height: Number(r.height),
            weight: Number(r.weight),
            head_circumference: r.head_circumference ? Number(r.head_circumference) : null
          }));
        }
      } catch (err) {
        console.warn('Supabase growth records failed, checking local cache:', err);
      }

      if (!data) {
        const cached = localStorage.getItem(this.getLocalKey('growth_records', childId));
        data = cached ? JSON.parse(cached) : [];
      } else {
        localStorage.setItem(this.getLocalKey('growth_records', childId), JSON.stringify(data));
      }

      // Ensure records are ordered by record_date ascending
      data?.sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());

      this.recordsSignal.set(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading growth records:', error);
      return [];
    }
  }

  async addGrowthRecord(
    recordData: Omit<GrowthRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<GrowthRecord> {
    try {
      let created: GrowthRecord | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('child_growth_records')
          .insert({
            child_id: recordData.child_id,
            family_id: recordData.family_id,
            record_date: recordData.record_date,
            height: recordData.height,
            weight: recordData.weight,
            head_circumference: recordData.head_circumference || null,
            note: recordData.note || null,
            created_by: recordData.created_by || null
          })
          .select()
          .single();

        if (!res.error && res.data) {
          created = {
            ...res.data,
            height: Number(res.data.height),
            weight: Number(res.data.weight),
            head_circumference: res.data.head_circumference ? Number(res.data.head_circumference) : null
          };
        }
      } catch (err) {
        console.warn('Insert growth record in Supabase failed, using local cache:', err);
      }

      if (!created) {
        created = {
          ...recordData,
          id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      const list = [...this.recordsSignal(), created].sort(
        (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
      );
      this.recordsSignal.set(list);
      localStorage.setItem(this.getLocalKey('growth_records', recordData.child_id), JSON.stringify(list));

      return created;
    } catch (error) {
      console.error('Error adding growth record:', error);
      throw error;
    }
  }

  async updateGrowthRecord(id: string, updates: Partial<GrowthRecord>): Promise<GrowthRecord | null> {
    try {
      let updated: GrowthRecord | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('child_growth_records')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!res.error && res.data) {
          updated = {
            ...res.data,
            height: Number(res.data.height),
            weight: Number(res.data.weight),
            head_circumference: res.data.head_circumference ? Number(res.data.head_circumference) : null
          };
        }
      } catch (err) {
        console.warn('Update growth record in Supabase failed:', err);
      }

      const list = this.recordsSignal().map(r => {
        if (r.id === id) {
          const item = updated || { ...r, ...updates, updated_at: new Date().toISOString() };
          updated = item;
          return item;
        }
        return r;
      }).sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());

      this.recordsSignal.set(list);
      const child = this.selectedChildSignal();
      if (child) {
        localStorage.setItem(this.getLocalKey('growth_records', child.id), JSON.stringify(list));
      }

      return updated;
    } catch (error) {
      console.error('Error updating growth record:', error);
      throw error;
    }
  }

  async deleteGrowthRecord(id: string): Promise<void> {
    try {
      try {
        await (this.supabase.db as any).from('child_growth_records').delete().eq('id', id);
      } catch (err) {
        console.warn('Delete growth record in Supabase failed:', err);
      }

      const list = this.recordsSignal().filter(r => r.id !== id);
      this.recordsSignal.set(list);
      const child = this.selectedChildSignal();
      if (child) {
        localStorage.setItem(this.getLocalKey('growth_records', child.id), JSON.stringify(list));
      }
    } catch (error) {
      console.error('Error deleting growth record:', error);
      throw error;
    }
  }

  // ==========================================
  // Milestones Management
  // ==========================================

  async loadMilestones(childId: string, familyId: string): Promise<ChildMilestone[]> {
    try {
      let data: ChildMilestone[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('child_milestones')
          .select('*')
          .eq('child_id', childId)
          .order('target_age_months', { ascending: true });

        if (!res.error && res.data && res.data.length > 0) {
          data = res.data;
        }
      } catch (err) {
        console.warn('Supabase milestones failed, checking local cache:', err);
      }

      if (!data || data.length === 0) {
        const cached = localStorage.getItem(this.getLocalKey('milestones', childId));
        if (cached) {
          data = JSON.parse(cached);
        } else {
          // Initialize default milestones
          data = await this.initDefaultMilestones(childId, familyId);
        }
      } else {
        localStorage.setItem(this.getLocalKey('milestones', childId), JSON.stringify(data));
      }

      this.milestonesSignal.set(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading milestones:', error);
      return [];
    }
  }

  private async initDefaultMilestones(childId: string, familyId: string): Promise<ChildMilestone[]> {
    const templates = getDefaultMilestones(childId, familyId);
    const result: ChildMilestone[] = [];

    // Try bulk insert in Supabase
    try {
      const res = await (this.supabase.db as any)
        .from('child_milestones')
        .insert(templates)
        .select();

      if (!res.error && res.data && res.data.length > 0) {
        this.milestonesSignal.set(res.data);
        localStorage.setItem(this.getLocalKey('milestones', childId), JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.warn('Bulk insert default milestones in Supabase failed:', err);
    }

    // Local fallback
    templates.forEach((t, index) => {
      result.push({
        ...t,
        id: 'ms_' + childId + '_' + index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    this.milestonesSignal.set(result);
    localStorage.setItem(this.getLocalKey('milestones', childId), JSON.stringify(result));
    return result;
  }

  async toggleMilestone(
    id: string,
    achieved: boolean,
    achievedDate?: string | null,
    note?: string | null
  ): Promise<void> {
    try {
      const updates = {
        achieved,
        achieved_date: achieved ? (achievedDate || new Date().toISOString().split('T')[0]) : null,
        note: note !== undefined ? note : null
      };

      try {
        await (this.supabase.db as any)
          .from('child_milestones')
          .update(updates)
          .eq('id', id);
      } catch (err) {
        console.warn('Update milestone in Supabase failed:', err);
      }

      const list = this.milestonesSignal().map(m => {
        if (m.id === id) {
          return {
            ...m,
            ...updates,
            updated_at: new Date().toISOString()
          };
        }
        return m;
      });

      this.milestonesSignal.set(list);
      const child = this.selectedChildSignal();
      if (child) {
        localStorage.setItem(this.getLocalKey('milestones', child.id), JSON.stringify(list));
      }
    } catch (error) {
      console.error('Error toggling milestone:', error);
      throw error;
    }
  }

  async addCustomMilestone(
    milestoneData: Omit<ChildMilestone, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ChildMilestone> {
    try {
      let created: ChildMilestone | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('child_milestones')
          .insert(milestoneData)
          .select()
          .single();

        if (!res.error && res.data) {
          created = res.data;
        }
      } catch (err) {
        console.warn('Insert custom milestone in Supabase failed:', err);
      }

      if (!created) {
        created = {
          ...milestoneData,
          id: 'ms_cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      const list = [...this.milestonesSignal(), created].sort(
        (a, b) => (a.target_age_months || 0) - (b.target_age_months || 0)
      );
      this.milestonesSignal.set(list);
      localStorage.setItem(this.getLocalKey('milestones', milestoneData.child_id), JSON.stringify(list));

      return created;
    } catch (error) {
      console.error('Error adding custom milestone:', error);
      throw error;
    }
  }

  async deleteMilestone(id: string): Promise<void> {
    try {
      try {
        await (this.supabase.db as any).from('child_milestones').delete().eq('id', id);
      } catch (err) {
        console.warn('Delete milestone in Supabase failed:', err);
      }

      const list = this.milestonesSignal().filter(m => m.id !== id);
      this.milestonesSignal.set(list);
      const child = this.selectedChildSignal();
      if (child) {
        localStorage.setItem(this.getLocalKey('milestones', child.id), JSON.stringify(list));
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }
}
