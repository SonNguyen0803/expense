import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { FamilyRepository } from '../../core/services/family.repository';
import { AuthService } from '../../core/auth/auth.service';
import { AssetRepository } from '../../core/services/asset.repository';
import {
  HomeAsset,
  AssetMaintenance,
  AssetCategory,
  RoomLocation,
  AssetStatus,
  MaintenanceType
} from '../../core/models';
import {
  ASSET_CATEGORIES,
  ROOM_LOCATIONS,
  ASSET_STATUSES,
  MAINTENANCE_TYPES,
  getCategoryMeta,
  getRoomMeta,
  getStatusMeta,
  getMaintenanceTypeMeta,
  getWarrantyInfo,
  getMaintenanceDueInfo,
  formatVND
} from '../../core/utils/asset.util';
import { formatDateDDMMYYYY } from '../../core/utils/date.util';

type ActiveTab = 'INVENTORY' | 'MAINTENANCE' | 'REMINDERS' | 'ANALYTICS';
type ViewMode = 'GRID' | 'TABLE';

@Component({
  selector: 'app-home-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NgxEchartsDirective],
  templateUrl: './home-assets.component.html'
})
export class HomeAssetsComponent implements OnInit {
  currentFamily;
  currentUser;

  // Repository signals
  assets;
  maintenances;
  selectedAsset;
  loading;
  stats;
  maintenanceDueAssets;
  warrantyAttentionAssets;

  // View & Tab state
  activeTab = signal<ActiveTab>('INVENTORY');
  viewMode = signal<ViewMode>('GRID');

  // Search & Filters
  searchQuery = signal<string>('');
  filterCategory = signal<string>('ALL');
  filterRoom = signal<string>('ALL');
  filterStatus = signal<string>('ALL');
  sortBy = signal<'name' | 'purchase_date' | 'purchase_price' | 'warranty'>('purchase_date');
  sortAsc = signal<boolean>(false);

  // Maintenance tab filter
  maintenanceAssetFilter = signal<string>('ALL');

  // Modal states
  showAssetModal = signal<boolean>(false);
  isEditAsset = signal<boolean>(false);
  editingAssetId = signal<string | null>(null);

  showMaintenanceModal = signal<boolean>(false);
  targetMaintenanceAsset = signal<HomeAsset | null>(null);

  showDetailModal = signal<boolean>(false);
  detailAsset = signal<HomeAsset | null>(null);

  showDeleteConfirm = signal<boolean>(false);
  deleteTarget = signal<{ type: 'ASSET' | 'MAINTENANCE'; id: string; name: string } | null>(null);

  // Forms
  assetForm: FormGroup;
  maintenanceForm: FormGroup;

  // Constants for template
  categories = ASSET_CATEGORIES;
  rooms = ROOM_LOCATIONS;
  statuses = ASSET_STATUSES;
  maintenanceTypes = MAINTENANCE_TYPES;

  // Helpers
  getCategoryMeta = getCategoryMeta;
  getRoomMeta = getRoomMeta;
  getStatusMeta = getStatusMeta;
  getMaintenanceTypeMeta = getMaintenanceTypeMeta;
  getWarrantyInfo = getWarrantyInfo;
  getMaintenanceDueInfo = getMaintenanceDueInfo;
  formatVND = formatVND;
  formatDate = formatDateDDMMYYYY;

  // Charts options
  categoryChartOption: EChartsOption = {};
  roomChartOption: EChartsOption = {};

  // Filtered assets computed
  filteredAssets = computed(() => {
    let list = [...this.assets()];
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.filterCategory();
    const rm = this.filterRoom();
    const st = this.filterStatus();

    if (query) {
      list = list.filter(a =>
        a.name.toLowerCase().includes(query) ||
        (a.brand && a.brand.toLowerCase().includes(query)) ||
        (a.model && a.model.toLowerCase().includes(query)) ||
        (a.serial_number && a.serial_number.toLowerCase().includes(query)) ||
        (a.vendor && a.vendor.toLowerCase().includes(query))
      );
    }

    if (cat !== 'ALL') {
      list = list.filter(a => a.category === cat);
    }

    if (rm !== 'ALL') {
      list = list.filter(a => a.room_location === rm);
    }

    if (st !== 'ALL') {
      list = list.filter(a => a.status === st);
    }

    const sort = this.sortBy();
    const asc = this.sortAsc();

    list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sort === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sort === 'purchase_price') {
        valA = Number(a.purchase_price || 0);
        valB = Number(b.purchase_price || 0);
      } else if (sort === 'warranty') {
        valA = a.warranty_end_date ? new Date(a.warranty_end_date).getTime() : 0;
        valB = b.warranty_end_date ? new Date(b.warranty_end_date).getTime() : 0;
      } else {
        // default purchase_date
        valA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
        valB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
      }

      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });

    return list;
  });

  // Filtered maintenance list
  filteredMaintenances = computed(() => {
    let list = [...this.maintenances()];
    const assetId = this.maintenanceAssetFilter();
    if (assetId !== 'ALL') {
      list = list.filter(m => m.asset_id === assetId);
    }
    // Join asset name if available
    const assetMap = new Map(this.assets().map(a => [a.id, a]));
    return list.map(m => ({
      ...m,
      asset: assetMap.get(m.asset_id)
    }));
  });

  // Detail asset maintenances
  detailMaintenances = computed(() => {
    const current = this.detailAsset();
    if (!current) return [];
    return this.maintenances().filter(m => m.asset_id === current.id);
  });

  constructor(
    public assetRepo: AssetRepository,
    private familyRepo: FamilyRepository,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.currentUser = this.authService.user;
    this.assets = this.assetRepo.assets;
    this.maintenances = this.assetRepo.maintenances;
    this.selectedAsset = this.assetRepo.selectedAsset;
    this.loading = this.assetRepo.loading;
    this.stats = this.assetRepo.stats;
    this.maintenanceDueAssets = this.assetRepo.maintenanceDueAssets;
    this.warrantyAttentionAssets = this.assetRepo.warrantyAttentionAssets;

    // Asset Form
    this.assetForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['ELECTRONICS', Validators.required],
      room_location: ['LIVING_ROOM', Validators.required],
      purchase_date: [new Date().toISOString().split('T')[0]],
      purchase_price: [0, [Validators.min(0)]],
      current_value: [0, [Validators.min(0)]],
      status: ['ACTIVE', Validators.required],
      brand: [''],
      model: [''],
      serial_number: [''],
      vendor: [''],
      warranty_months: [0, [Validators.min(0)]],
      warranty_end_date: [''],
      maintenance_period_months: [0, [Validators.min(0)]],
      next_maintenance_date: [''],
      assigned_to: [''],
      notes: ['']
    });

    // Auto-update warranty end date when purchase_date and warranty_months change
    this.assetForm.get('warranty_months')?.valueChanges.subscribe(months => {
      this.calculateWarrantyEndDate();
    });
    this.assetForm.get('purchase_date')?.valueChanges.subscribe(date => {
      this.calculateWarrantyEndDate();
    });

    // Maintenance Form
    this.maintenanceForm = this.fb.group({
      asset_id: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(2)]],
      type: ['PERIODIC', Validators.required],
      maintenance_date: [new Date().toISOString().split('T')[0], Validators.required],
      cost: [0, [Validators.min(0)]],
      service_provider: [''],
      technician_contact: [''],
      notes: [''],
      next_maintenance_date: ['']
    });

    // Chart reaction effect
    effect(() => {
      const currentList = this.assets();
      this.updateCharts(currentList);
    });
  }

  ngOnInit() {
    const family = this.currentFamily();
    if (family) {
      this.assetRepo.loadAssets(family.id);
    }
  }

  calculateWarrantyEndDate() {
    const purchaseDateStr = this.assetForm.get('purchase_date')?.value;
    const months = Number(this.assetForm.get('warranty_months')?.value || 0);

    if (purchaseDateStr && months > 0) {
      const pDate = new Date(purchaseDateStr);
      pDate.setMonth(pDate.getMonth() + months);
      const yyyy = pDate.getFullYear();
      const mm = String(pDate.getMonth() + 1).padStart(2, '0');
      const dd = String(pDate.getDate()).padStart(2, '0');
      this.assetForm.patchValue({ warranty_end_date: `${yyyy}-${mm}-${dd}` }, { emitEvent: false });
    }
  }

  updateCharts(assets: HomeAsset[]) {
    // 1. Category Chart
    const catCounts: { [key: string]: number } = {};
    const catValues: { [key: string]: number } = {};

    for (const a of assets) {
      const val = Number(a.current_value !== undefined && a.current_value !== null ? a.current_value : a.purchase_price || 0);
      catCounts[a.category] = (catCounts[a.category] || 0) + 1;
      catValues[a.category] = (catValues[a.category] || 0) + val;
    }

    const pieData = Object.keys(catValues).map(key => {
      const meta = getCategoryMeta(key as AssetCategory);
      return {
        name: meta.label,
        value: catValues[key],
        itemStyle: { color: meta.color }
      };
    });

    this.categoryChartOption = {
      title: {
        text: 'Phân bổ giá trị tài sản',
        subtext: 'Theo nhóm danh mục',
        left: 'center',
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/><b>${formatVND(params.value)}</b> (${params.percent}%)`;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: 10
      },
      series: [
        {
          name: 'Danh mục',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: pieData.length > 0 ? pieData : [{ name: 'Chưa có', value: 0 }]
        }
      ]
    };

    // 2. Room Chart
    const roomCounts: { [key: string]: number } = {};
    for (const a of assets) {
      roomCounts[a.room_location] = (roomCounts[a.room_location] || 0) + 1;
    }

    const roomKeys = ROOM_LOCATIONS.map(r => r.key);
    const roomLabels = ROOM_LOCATIONS.map(r => `${r.icon} ${r.label}`);
    const roomValues = roomKeys.map(k => roomCounts[k] || 0);

    this.roomChartOption = {
      title: {
        text: 'Số lượng thiết bị theo khu vực',
        subtext: 'Phân bổ theo phòng',
        left: 'center',
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: roomLabels,
        axisLabel: {
          interval: 0,
          rotate: 30,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1
      },
      series: [
        {
          name: 'Số lượng món',
          type: 'bar',
          data: roomValues,
          itemStyle: {
            color: '#0ea5e9',
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  }

  // ==========================================
  // Modal & Action handlers
  // ==========================================

  openAddAssetModal() {
    this.isEditAsset.set(false);
    this.editingAssetId.set(null);
    this.assetForm.reset({
      name: '',
      category: 'ELECTRONICS',
      room_location: 'LIVING_ROOM',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_price: 0,
      current_value: 0,
      status: 'ACTIVE',
      brand: '',
      model: '',
      serial_number: '',
      vendor: '',
      warranty_months: 12,
      warranty_end_date: '',
      maintenance_period_months: 6,
      next_maintenance_date: '',
      assigned_to: '',
      notes: ''
    });
    this.calculateWarrantyEndDate();
    this.showAssetModal.set(true);
  }

  openEditAssetModal(asset: HomeAsset) {
    this.isEditAsset.set(true);
    this.editingAssetId.set(asset.id);
    this.assetForm.patchValue({
      name: asset.name,
      category: asset.category,
      room_location: asset.room_location,
      purchase_date: asset.purchase_date || '',
      purchase_price: asset.purchase_price || 0,
      current_value: asset.current_value !== undefined ? asset.current_value : asset.purchase_price || 0,
      status: asset.status,
      brand: asset.brand || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      vendor: asset.vendor || '',
      warranty_months: asset.warranty_months || 0,
      warranty_end_date: asset.warranty_end_date || '',
      maintenance_period_months: asset.maintenance_period_months || 0,
      next_maintenance_date: asset.next_maintenance_date || '',
      assigned_to: asset.assigned_to || '',
      notes: asset.notes || ''
    });
    this.showAssetModal.set(true);
  }

  closeAssetModal() {
    this.showAssetModal.set(false);
    this.editingAssetId.set(null);
  }

  async saveAsset() {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched();
      return;
    }

    const family = this.currentFamily();
    if (!family) return;

    const formValues = this.assetForm.value;

    if (this.isEditAsset()) {
      const id = this.editingAssetId();
      if (!id) return;
      await this.assetRepo.updateAsset(id, family.id, formValues);
      if (this.detailAsset()?.id === id) {
        const fresh = this.assets().find(a => a.id === id) || null;
        this.detailAsset.set(fresh);
      }
    } else {
      await this.assetRepo.createAsset({
        ...formValues,
        family_id: family.id
      });
    }

    this.closeAssetModal();
  }

  openDetailModal(asset: HomeAsset) {
    this.detailAsset.set(asset);
    this.showDetailModal.set(true);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.detailAsset.set(null);
  }

  openAddMaintenanceModal(targetAsset?: HomeAsset) {
    const asset = targetAsset || (this.assets().length > 0 ? this.assets()[0] : null);
    this.targetMaintenanceAsset.set(asset);

    this.maintenanceForm.reset({
      asset_id: asset ? asset.id : '',
      title: '',
      type: 'PERIODIC',
      maintenance_date: new Date().toISOString().split('T')[0],
      cost: 0,
      service_provider: '',
      technician_contact: '',
      notes: '',
      next_maintenance_date: ''
    });

    this.showMaintenanceModal.set(true);
  }

  closeMaintenanceModal() {
    this.showMaintenanceModal.set(false);
    this.targetMaintenanceAsset.set(null);
  }

  async saveMaintenance() {
    if (this.maintenanceForm.invalid) {
      this.maintenanceForm.markAllAsTouched();
      return;
    }

    const family = this.currentFamily();
    if (!family) return;

    const values = this.maintenanceForm.value;
    await this.assetRepo.createMaintenance({
      ...values,
      family_id: family.id
    });

    this.closeMaintenanceModal();
  }

  confirmDeleteAsset(asset: HomeAsset) {
    this.deleteTarget.set({
      type: 'ASSET',
      id: asset.id,
      name: asset.name
    });
    this.showDeleteConfirm.set(true);
  }

  confirmDeleteMaintenance(record: AssetMaintenance) {
    this.deleteTarget.set({
      type: 'MAINTENANCE',
      id: record.id,
      name: record.title
    });
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  async executeDelete() {
    const target = this.deleteTarget();
    const family = this.currentFamily();
    if (!target || !family) return;

    if (target.type === 'ASSET') {
      await this.assetRepo.deleteAsset(target.id, family.id);
      if (this.detailAsset()?.id === target.id) {
        this.closeDetailModal();
      }
    } else {
      await this.assetRepo.deleteMaintenance(target.id, family.id);
    }

    this.closeDeleteConfirm();
  }

  toggleSort(type: 'name' | 'purchase_date' | 'purchase_price' | 'warranty') {
    if (this.sortBy() === type) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortBy.set(type);
      this.sortAsc.set(false);
    }
  }
}
