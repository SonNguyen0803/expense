import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { HomeAsset, AssetMaintenance, AssetStatsSummary } from '../models';
import { getDefaultSampleAssets, getWarrantyInfo, getMaintenanceDueInfo } from '../utils/asset.util';

@Injectable({
  providedIn: 'root'
})
export class AssetRepository {
  private assetsSignal = signal<HomeAsset[]>([]);
  private maintenancesSignal = signal<AssetMaintenance[]>([]);
  private selectedAssetSignal = signal<HomeAsset | null>(null);
  private loadingSignal = signal<boolean>(false);

  // Readonly signals
  assets = this.assetsSignal.asReadonly();
  maintenances = this.maintenancesSignal.asReadonly();
  selectedAsset = this.selectedAssetSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  // Computed: Stats summary
  stats = computed<AssetStatsSummary>(() => {
    const list = this.assetsSignal();
    const allMaintenances = this.maintenancesSignal();

    let totalPurchaseCost = 0;
    let totalCurrentValue = 0;
    let expiringWarrantyCount = 0;
    let activeCount = 0;
    let needsMaintenanceCount = 0;
    let brokenCount = 0;

    for (const item of list) {
      totalPurchaseCost += Number(item.purchase_price || 0);
      totalCurrentValue += Number(item.current_value !== undefined && item.current_value !== null ? item.current_value : item.purchase_price || 0);

      if (item.status === 'ACTIVE') activeCount++;
      else if (item.status === 'NEEDS_MAINTENANCE' || item.status === 'UNDER_REPAIR') needsMaintenanceCount++;
      else if (item.status === 'BROKEN') brokenCount++;

      const warranty = getWarrantyInfo(item.warranty_end_date);
      if (warranty.status === 'EXPIRING_SOON') {
        expiringWarrantyCount++;
      }
    }

    const totalMaintenanceCost = allMaintenances.reduce((sum, m) => sum + Number(m.cost || 0), 0);

    return {
      totalAssets: list.length,
      totalPurchaseCost,
      totalCurrentValue,
      totalMaintenanceCost,
      expiringWarrantyCount,
      activeCount,
      needsMaintenanceCount,
      brokenCount
    };
  });

  // Computed: Assets requiring maintenance attention (due or overdue)
  maintenanceDueAssets = computed(() => {
    return this.assetsSignal().filter(a => {
      if (a.status === 'NEEDS_MAINTENANCE' || a.status === 'UNDER_REPAIR' || a.status === 'BROKEN') return true;
      if (a.next_maintenance_date) {
        const info = getMaintenanceDueInfo(a.next_maintenance_date);
        return info.isDue;
      }
      return false;
    });
  });

  // Computed: Assets with expiring or expired warranty
  warrantyAttentionAssets = computed(() => {
    return this.assetsSignal().filter(a => {
      if (!a.warranty_end_date) return false;
      const info = getWarrantyInfo(a.warranty_end_date);
      return info.status === 'EXPIRING_SOON' || info.status === 'EXPIRED';
    });
  });

  constructor(private supabase: SupabaseService) {}

  private getLocalKey(type: string, familyId: string): string {
    return `family_asset_${type}_${familyId}`;
  }

  // ==========================================
  // Asset CRUD
  // ==========================================

  async loadAssets(familyId: string): Promise<HomeAsset[]> {
    this.loadingSignal.set(true);
    try {
      let data: HomeAsset[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('home_assets')
          .select('*')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false });

        if (!res.error && res.data) {
          data = res.data;
        }
      } catch (err) {
        console.warn('Supabase home_assets table not available, using local fallback:', err);
      }

      // Check local storage if Supabase failed
      if (!data) {
        const cached = localStorage.getItem(this.getLocalKey('items', familyId));
        if (cached) {
          data = JSON.parse(cached);
        } else {
          // Initialize with friendly default sample assets
          data = getDefaultSampleAssets(familyId);
          localStorage.setItem(this.getLocalKey('items', familyId), JSON.stringify(data));
        }
      } else {
        localStorage.setItem(this.getLocalKey('items', familyId), JSON.stringify(data));
      }

      this.assetsSignal.set(data || []);

      // Also load maintenance records for all assets in this family
      await this.loadMaintenances(familyId);

      return data || [];
    } catch (error) {
      console.error('Error loading home assets:', error);
      return [];
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async createAsset(asset: Partial<HomeAsset> & { family_id: string; name: string }): Promise<HomeAsset | null> {
    this.loadingSignal.set(true);
    try {
      const now = new Date().toISOString();
      const newAsset: HomeAsset = {
        id: crypto.randomUUID(),
        family_id: asset.family_id,
        name: asset.name.trim(),
        category: asset.category || 'OTHER',
        room_location: asset.room_location || 'LIVING_ROOM',
        purchase_date: asset.purchase_date || null,
        purchase_price: asset.purchase_price ? Number(asset.purchase_price) : 0,
        current_value: asset.current_value !== undefined && asset.current_value !== null ? Number(asset.current_value) : Number(asset.purchase_price || 0),
        status: asset.status || 'ACTIVE',
        brand: asset.brand?.trim() || null,
        model: asset.model?.trim() || null,
        serial_number: asset.serial_number?.trim() || null,
        vendor: asset.vendor?.trim() || null,
        warranty_months: asset.warranty_months ? Number(asset.warranty_months) : 0,
        warranty_end_date: asset.warranty_end_date || null,
        maintenance_period_months: asset.maintenance_period_months ? Number(asset.maintenance_period_months) : 0,
        next_maintenance_date: asset.next_maintenance_date || null,
        assigned_to: asset.assigned_to?.trim() || null,
        image_url: asset.image_url?.trim() || null,
        notes: asset.notes?.trim() || null,
        created_at: now,
        updated_at: now,
        maintenances_count: 0,
        total_maintenance_cost: 0
      };

      try {
        const res = await (this.supabase.db as any)
          .from('home_assets')
          .insert([newAsset])
          .select()
          .single();

        if (!res.error && res.data) {
          newAsset.id = res.data.id;
        }
      } catch (err) {
        console.warn('Supabase insert failed, continuing with local storage:', err);
      }

      const updatedList = [newAsset, ...this.assetsSignal()];
      this.assetsSignal.set(updatedList);
      localStorage.setItem(this.getLocalKey('items', asset.family_id), JSON.stringify(updatedList));

      return newAsset;
    } catch (error) {
      console.error('Error creating asset:', error);
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateAsset(id: string, familyId: string, changes: Partial<HomeAsset>): Promise<boolean> {
    this.loadingSignal.set(true);
    try {
      const now = new Date().toISOString();
      const updatedFields = {
        ...changes,
        updated_at: now
      };

      try {
        await (this.supabase.db as any)
          .from('home_assets')
          .update(updatedFields)
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update failed, continuing with local storage:', err);
      }

      const updatedList = this.assetsSignal().map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updatedFields };
          if (this.selectedAssetSignal()?.id === id) {
            this.selectedAssetSignal.set(updated);
          }
          return updated;
        }
        return item;
      });

      this.assetsSignal.set(updatedList);
      localStorage.setItem(this.getLocalKey('items', familyId), JSON.stringify(updatedList));
      return true;
    } catch (error) {
      console.error('Error updating asset:', error);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async deleteAsset(id: string, familyId: string): Promise<boolean> {
    this.loadingSignal.set(true);
    try {
      try {
        await (this.supabase.db as any)
          .from('home_assets')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase delete failed, continuing with local storage:', err);
      }

      const updatedList = this.assetsSignal().filter(item => item.id !== id);
      this.assetsSignal.set(updatedList);
      localStorage.setItem(this.getLocalKey('items', familyId), JSON.stringify(updatedList));

      // Also clean up maintenances for this asset
      const updatedMaintenances = this.maintenancesSignal().filter(m => m.asset_id !== id);
      this.maintenancesSignal.set(updatedMaintenances);
      localStorage.setItem(this.getLocalKey('maintenances', familyId), JSON.stringify(updatedMaintenances));

      if (this.selectedAssetSignal()?.id === id) {
        this.selectedAssetSignal.set(null);
      }

      return true;
    } catch (error) {
      console.error('Error deleting asset:', error);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  selectAsset(asset: HomeAsset | null) {
    this.selectedAssetSignal.set(asset);
  }

  // ==========================================
  // Maintenance Records
  // ==========================================

  async loadMaintenances(familyId: string, assetId?: string): Promise<AssetMaintenance[]> {
    try {
      let data: AssetMaintenance[] | null = null;
      try {
        let query = (this.supabase.db as any)
          .from('asset_maintenances')
          .select('*')
          .eq('family_id', familyId)
          .order('maintenance_date', { ascending: false });

        if (assetId) {
          query = query.eq('asset_id', assetId);
        }

        const res = await query;
        if (!res.error && res.data) {
          data = res.data;
        }
      } catch (err) {
        console.warn('Supabase asset_maintenances table not available, using local cache:', err);
      }

      if (!data) {
        const cached = localStorage.getItem(this.getLocalKey('maintenances', familyId));
        if (cached) {
          data = JSON.parse(cached);
          if (assetId) {
            data = (data || []).filter(m => m.asset_id === assetId);
          }
        } else {
          data = [];
        }
      } else {
        localStorage.setItem(this.getLocalKey('maintenances', familyId), JSON.stringify(data));
      }

      this.maintenancesSignal.set(data || []);
      this.updateAssetMaintenanceStats(data || []);

      return data || [];
    } catch (error) {
      console.error('Error loading maintenances:', error);
      return [];
    }
  }

  async createMaintenance(entry: Partial<AssetMaintenance> & { asset_id: string; family_id: string; title: string }): Promise<AssetMaintenance | null> {
    try {
      const now = new Date().toISOString();
      const newRecord: AssetMaintenance = {
        id: crypto.randomUUID(),
        asset_id: entry.asset_id,
        family_id: entry.family_id,
        title: entry.title.trim(),
        type: entry.type || 'PERIODIC',
        maintenance_date: entry.maintenance_date || now.split('T')[0],
        cost: entry.cost ? Number(entry.cost) : 0,
        service_provider: entry.service_provider?.trim() || null,
        technician_contact: entry.technician_contact?.trim() || null,
        notes: entry.notes?.trim() || null,
        next_maintenance_date: entry.next_maintenance_date || null,
        created_at: now,
        updated_at: now
      };

      try {
        const res = await (this.supabase.db as any)
          .from('asset_maintenances')
          .insert([newRecord])
          .select()
          .single();

        if (!res.error && res.data) {
          newRecord.id = res.data.id;
        }
      } catch (err) {
        console.warn('Supabase insert maintenance failed, using local storage:', err);
      }

      const updated = [newRecord, ...this.maintenancesSignal()];
      this.maintenancesSignal.set(updated);
      localStorage.setItem(this.getLocalKey('maintenances', entry.family_id), JSON.stringify(updated));

      // If next_maintenance_date is specified, optionally sync to asset's next_maintenance_date
      if (entry.next_maintenance_date) {
        await this.updateAsset(entry.asset_id, entry.family_id, {
          next_maintenance_date: entry.next_maintenance_date
        });
      }

      this.updateAssetMaintenanceStats(updated);
      return newRecord;
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      return null;
    }
  }

  async deleteMaintenance(id: string, familyId: string): Promise<boolean> {
    try {
      try {
        await (this.supabase.db as any)
          .from('asset_maintenances')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase delete maintenance failed, continuing with local storage:', err);
      }

      const updated = this.maintenancesSignal().filter(m => m.id !== id);
      this.maintenancesSignal.set(updated);
      localStorage.setItem(this.getLocalKey('maintenances', familyId), JSON.stringify(updated));
      this.updateAssetMaintenanceStats(updated);

      return true;
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      return false;
    }
  }

  private updateAssetMaintenanceStats(maintenances: AssetMaintenance[]) {
    const assetList = this.assetsSignal();
    const updated = assetList.map(asset => {
      const records = maintenances.filter(m => m.asset_id === asset.id);
      const totalCost = records.reduce((sum, r) => sum + Number(r.cost || 0), 0);
      return {
        ...asset,
        maintenances_count: records.length,
        total_maintenance_cost: totalCost
      };
    });
    this.assetsSignal.set(updated);
  }
}
