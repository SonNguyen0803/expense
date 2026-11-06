import { AssetCategory, RoomLocation, AssetStatus, MaintenanceType, HomeAsset } from '../models';

export interface CategoryMeta {
  key: AssetCategory;
  label: string;
  icon: string;
  badgeClass: string;
  color: string;
}

export const ASSET_CATEGORIES: CategoryMeta[] = [
  { key: 'ELECTRONICS', label: 'Điện tử & Công nghệ', icon: '💻', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', color: '#3b82f6' },
  { key: 'APPLIANCES', label: 'Thiết bị gia dụng lớn', icon: '🧊', badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300', color: '#06b6d4' },
  { key: 'FURNITURE', label: 'Nội thất & Trang trí', icon: '🛋️', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', color: '#f59e0b' },
  { key: 'VEHICLES', label: 'Phương tiện đi lại', icon: '🛵', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300', color: '#8b5cf6' },
  { key: 'KITCHEN', label: 'Đồ dùng nhà bếp', icon: '🍳', badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', color: '#f97316' },
  { key: 'VALUABLES', label: 'Tài sản giá trị', icon: '💎', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', color: '#10b981' },
  { key: 'OTHER', label: 'Khác', icon: '📦', badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', color: '#6b7280' },
];

export interface RoomMeta {
  key: RoomLocation;
  label: string;
  icon: string;
}

export const ROOM_LOCATIONS: RoomMeta[] = [
  { key: 'LIVING_ROOM', label: 'Phòng khách', icon: '🛋️' },
  { key: 'KITCHEN', label: 'Phòng bếp & Ăn', icon: '🍳' },
  { key: 'BEDROOM_MASTER', label: 'Phòng ngủ Master', icon: '🛏️' },
  { key: 'BEDROOM_KIDS', label: 'Phòng ngủ con', icon: '🧸' },
  { key: 'WORK_ROOM', label: 'Phòng làm việc', icon: '💻' },
  { key: 'BALCONY', label: 'Ban công / Sân vườn', icon: '🌿' },
  { key: 'GARAGE', label: 'Nhà xe / Gara', icon: '🚗' },
  { key: 'STORAGE', label: 'Kho lưu trữ', icon: '📦' },
  { key: 'OTHER', label: 'Vị trí khác', icon: '📍' },
];

export interface StatusMeta {
  key: AssetStatus;
  label: string;
  icon: string;
  badgeClass: string;
}

export const ASSET_STATUSES: StatusMeta[] = [
  { key: 'ACTIVE', label: 'Đang dùng tốt', icon: '🟢', badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  { key: 'NEEDS_MAINTENANCE', label: 'Cần bảo dưỡng', icon: '🟡', badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
  { key: 'UNDER_REPAIR', label: 'Đang sửa chữa', icon: '🟠', badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
  { key: 'BROKEN', label: 'Hỏng hóc', icon: '🔴', badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  { key: 'DISPOSED', label: 'Đã thanh lý/bán', icon: '⚪', badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
];

export interface MaintenanceTypeMeta {
  key: MaintenanceType;
  label: string;
  icon: string;
  badgeClass: string;
}

export const MAINTENANCE_TYPES: MaintenanceTypeMeta[] = [
  { key: 'PERIODIC', label: 'Bảo dưỡng định kỳ', icon: '🔄', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  { key: 'REPAIR', label: 'Sửa chữa', icon: '🔧', badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
  { key: 'REPLACEMENT', label: 'Thay thế phụ linh kiện', icon: '⚙️', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  { key: 'INSPECTION', label: 'Kiểm tra kỹ thuật', icon: '🔍', badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' },
];

export function getCategoryMeta(key: AssetCategory): CategoryMeta {
  return ASSET_CATEGORIES.find(c => c.key === key) || ASSET_CATEGORIES[ASSET_CATEGORIES.length - 1];
}

export function getRoomMeta(key: RoomLocation): RoomMeta {
  return ROOM_LOCATIONS.find(r => r.key === key) || ROOM_LOCATIONS[ROOM_LOCATIONS.length - 1];
}

export function getStatusMeta(key: AssetStatus): StatusMeta {
  return ASSET_STATUSES.find(s => s.key === key) || ASSET_STATUSES[0];
}

export function getMaintenanceTypeMeta(key: MaintenanceType): MaintenanceTypeMeta {
  return MAINTENANCE_TYPES.find(m => m.key === key) || MAINTENANCE_TYPES[0];
}

export interface WarrantyInfo {
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NONE';
  daysLeft: number;
  label: string;
  badgeClass: string;
}

export function getWarrantyInfo(warrantyEndDate?: string | null): WarrantyInfo {
  if (!warrantyEndDate) {
    return {
      status: 'NONE',
      daysLeft: 0,
      label: 'Không có / Không rõ',
      badgeClass: 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(warrantyEndDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      status: 'EXPIRED',
      daysLeft,
      label: `Hết hạn ${Math.abs(daysLeft)} ngày trước`,
      badgeClass: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
    };
  } else if (daysLeft <= 30) {
    return {
      status: 'EXPIRING_SOON',
      daysLeft,
      label: daysLeft === 0 ? 'Hết hạn hôm nay' : `Còn ${daysLeft} ngày (Sắp hết)`,
      badgeClass: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 font-semibold'
    };
  } else {
    return {
      status: 'VALID',
      daysLeft,
      label: `Còn ${daysLeft} ngày`,
      badgeClass: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300'
    };
  }
}

export interface MaintenanceDueInfo {
  isDue: boolean;
  isOverdue: boolean;
  daysUntil: number;
  label: string;
}

export function getMaintenanceDueInfo(nextMaintenanceDate?: string | null): MaintenanceDueInfo {
  if (!nextMaintenanceDate) {
    return { isDue: false, isOverdue: false, daysUntil: 0, label: 'Chưa lên lịch' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(nextMaintenanceDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return {
      isDue: true,
      isOverdue: true,
      daysUntil,
      label: `Quá hạn bảo dưỡng ${Math.abs(daysUntil)} ngày`
    };
  } else if (daysUntil <= 14) {
    return {
      isDue: true,
      isOverdue: false,
      daysUntil,
      label: daysUntil === 0 ? 'Đến ngày bảo dưỡng hôm nay' : `Còn ${daysUntil} ngày tới lịch bảo dưỡng`
    };
  } else {
    return {
      isDue: false,
      isOverdue: false,
      daysUntil,
      label: `Lịch tiếp theo: ${nextMaintenanceDate}`
    };
  }
}

export function formatVND(amount?: number | string | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '0 ₫';
  return Number(amount).toLocaleString('vi-VN') + ' ₫';
}

export function getDefaultSampleAssets(familyId: string): HomeAsset[] {
  const now = new Date();
  const year = now.getFullYear();

  return [
    {
      id: 'sample-asset-1',
      family_id: familyId,
      name: 'Smart TV Sony Bravia OLED 65 inch',
      category: 'ELECTRONICS',
      room_location: 'LIVING_ROOM',
      purchase_date: `${year - 1}-03-15`,
      purchase_price: 32000000,
      current_value: 24000000,
      status: 'ACTIVE',
      brand: 'Sony',
      model: 'XR-65A80L',
      serial_number: 'SN-SONY-65A80L-88912',
      vendor: 'Điện máy Xanh',
      warranty_months: 24,
      warranty_end_date: `${year + 1}-03-15`,
      maintenance_period_months: 12,
      next_maintenance_date: `${year}-12-15`,
      assigned_to: 'Cả nhà',
      notes: 'Bảo hành chính hãng Sony Việt Nam. Kèm remote thông minh.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      maintenances_count: 1,
      total_maintenance_cost: 0
    },
    {
      id: 'sample-asset-2',
      family_id: familyId,
      name: 'Tủ lạnh LG Inverter French Door 635L',
      category: 'APPLIANCES',
      room_location: 'KITCHEN',
      purchase_date: `${year - 2}-05-20`,
      purchase_price: 28500000,
      current_value: 19000000,
      status: 'ACTIVE',
      brand: 'LG',
      model: 'GR-D257MC',
      serial_number: 'LG-REF-2024-5512',
      vendor: 'Nguyễn Kim',
      warranty_months: 24,
      warranty_end_date: `${year}-11-20`,
      maintenance_period_months: 6,
      next_maintenance_date: `${year}-11-25`,
      assigned_to: 'Gia đình',
      notes: 'Lấy nước ngoài, khử mùi kháng khuẩn Hygiene Fresh+.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      maintenances_count: 2,
      total_maintenance_cost: 450000
    },
    {
      id: 'sample-asset-3',
      family_id: familyId,
      name: 'Máy giặt sấy Electrolux UltimateCare 10kg/7kg',
      category: 'APPLIANCES',
      room_location: 'BALCONY',
      purchase_date: `${year - 1}-08-10`,
      purchase_price: 16500000,
      current_value: 12500000,
      status: 'NEEDS_MAINTENANCE',
      brand: 'Electrolux',
      model: 'EWW1042R7WC',
      serial_number: 'ELX-WASH-99120',
      vendor: 'Chợ Lớn',
      warranty_months: 24,
      warranty_end_date: `${year + 1}-08-10`,
      maintenance_period_months: 6,
      next_maintenance_date: `${year}-10-15`,
      assigned_to: 'Gia đình',
      notes: 'Cần vệ sinh lồng giặt và kiểm tra gioăng cao su.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      maintenances_count: 1,
      total_maintenance_cost: 300000
    },
    {
      id: 'sample-asset-4',
      family_id: familyId,
      name: 'Xe máy Honda Air Blade 160cc ABS',
      category: 'VEHICLES',
      room_location: 'GARAGE',
      purchase_date: `${year - 2}-01-10`,
      purchase_price: 58000000,
      current_value: 46000000,
      status: 'ACTIVE',
      brand: 'Honda',
      model: 'Air Blade 160 Đặc Biệt',
      serial_number: 'RLH-29A1-99882',
      vendor: 'HEAD Honda Phát Tiến',
      warranty_months: 36,
      warranty_end_date: `${year + 1}-01-10`,
      maintenance_period_months: 3,
      next_maintenance_date: `${year}-12-01`,
      assigned_to: 'Bố',
      notes: 'Bảo dưỡng định kỳ theo sổ bảo hành HEAD 30,000km.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      maintenances_count: 3,
      total_maintenance_cost: 1250000
    },
    {
      id: 'sample-asset-5',
      family_id: familyId,
      name: 'Bộ Sofa da góc chữ L phòng khách',
      category: 'FURNITURE',
      room_location: 'LIVING_ROOM',
      purchase_date: `${year - 1}-04-01`,
      purchase_price: 22000000,
      current_value: 17500000,
      status: 'ACTIVE',
      brand: 'Nội thất Phố Xinh',
      model: 'Sofa Da Bò Ý Carina L',
      serial_number: 'PX-SOFA-4412',
      vendor: 'Showroom Phố Xinh Q7',
      warranty_months: 12,
      warranty_end_date: `${year}-04-01`,
      maintenance_period_months: 6,
      next_maintenance_date: `${year}-11-30`,
      assigned_to: 'Cả nhà',
      notes: 'Cần thoa sáp dưỡng da định kỳ 6 tháng 1 lần để da luôn mềm đẹp.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      maintenances_count: 1,
      total_maintenance_cost: 200000
    }
  ];
}
