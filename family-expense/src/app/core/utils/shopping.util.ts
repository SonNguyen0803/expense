import { ShoppingCategory, ShoppingItemStatus, ShoppingPriority, ShoppingItem } from '../models';

export interface ShoppingCategoryMeta {
  key: ShoppingCategory;
  label: string;
  icon: string;
  badgeClass: string;
}

export const SHOPPING_CATEGORIES: ShoppingCategoryMeta[] = [
  { key: 'GROCERY', label: 'Thực phẩm & Đi chợ', icon: '🥦', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { key: 'HOME_SUPPLIES', label: 'Đồ gia dụng & Tiêu hao', icon: '🧻', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  { key: 'BABY_KIDS', label: 'Mẹ & Bé', icon: '🍼', badgeClass: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300' },
  { key: 'PERSONAL_CARE', label: 'Hóa mỹ phẩm & Chăm sóc', icon: '🧴', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  { key: 'ELECTRONICS', label: 'Công nghệ & Điện máy', icon: '🔌', badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
  { key: 'CLOTHING', label: 'Quần áo & Thời trang', icon: '👕', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  { key: 'OTHER', label: 'Món khác', icon: '📦', badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
];

export interface ShoppingStatusMeta {
  key: ShoppingItemStatus;
  label: string;
  icon: string;
  badgeClass: string;
  actionText: string;
}

export const SHOPPING_STATUSES: ShoppingStatusMeta[] = [
  { key: 'PENDING', label: 'Cần mua', icon: '🛒', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', actionText: 'Đưa vào giỏ' },
  { key: 'BUYING', label: 'Đang chọn mua', icon: '🔄', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', actionText: 'Đã mua xong' },
  { key: 'PURCHASED', label: 'Đã mua', icon: '✅', badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', actionText: 'Mua lại' },
  { key: 'CANCELLED', label: 'Đã hủy', icon: '❌', badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400', actionText: 'Khôi phục' }
];

export interface ShoppingPriorityMeta {
  key: ShoppingPriority;
  label: string;
  icon: string;
  badgeClass: string;
}

export const SHOPPING_PRIORITIES: ShoppingPriorityMeta[] = [
  { key: 'URGENT', label: 'Cực kỳ gấp', icon: '🔴', badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  { key: 'HIGH', label: 'Quan trọng', icon: '🟠', badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
  { key: 'NORMAL', label: 'Bình thường', icon: '🟢', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { key: 'LOW', label: 'Thong thả', icon: '⚪', badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
];

export const COMMON_UNITS = [
  'món', 'hộp', 'kg', 'g', 'chai', 'lon', 'gói', 'thùng', 'bó', 'túi', 'lốc', 'vỉ', 'cái'
];

export const POPULAR_STORES = [
  'WinMart', 'Co.opmart', 'Bách Hóa Xanh', 'Big C / Tops Market', 'Chợ truyền thống', 'Mega Market', 'Shopee / Tiki / Lazada', 'Cửa hàng tiện lợi'
];

export function getShoppingCategoryMeta(key: ShoppingCategory): ShoppingCategoryMeta {
  return SHOPPING_CATEGORIES.find(c => c.key === key) || SHOPPING_CATEGORIES[SHOPPING_CATEGORIES.length - 1];
}

export function getShoppingStatusMeta(key: ShoppingItemStatus): ShoppingStatusMeta {
  return SHOPPING_STATUSES.find(s => s.key === key) || SHOPPING_STATUSES[0];
}

export function getShoppingPriorityMeta(key: ShoppingPriority): ShoppingPriorityMeta {
  return SHOPPING_PRIORITIES.find(p => p.key === key) || SHOPPING_PRIORITIES[2];
}

export function getDefaultSampleShoppingItems(familyId: string): ShoppingItem[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'sample-shop-1',
      family_id: familyId,
      title: 'Sữa tươi Vinamilk 100% ít đường 1L',
      category: 'GROCERY',
      quantity: 4,
      unit: 'hộp',
      estimated_price: 140000,
      actual_price: null,
      priority: 'URGENT',
      status: 'PENDING',
      store_location: 'WinMart',
      target_date: today,
      assigned_to: 'Bố',
      notes: 'Lấy loại nắp vặn, date mới nhất',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sample-shop-2',
      family_id: familyId,
      title: 'Nước giặt xả OMO Matic túi 3.6kg',
      category: 'HOME_SUPPLIES',
      quantity: 1,
      unit: 'túi',
      estimated_price: 215000,
      actual_price: null,
      priority: 'HIGH',
      status: 'BUYING',
      store_location: 'Bách Hóa Xanh',
      target_date: today,
      assigned_to: 'Mẹ',
      notes: 'Mùi hoa oải hương',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sample-shop-3',
      family_id: familyId,
      title: 'Tã dán Bobby size L 68 miếng',
      category: 'BABY_KIDS',
      quantity: 2,
      unit: 'gói',
      estimated_price: 520000,
      actual_price: 510000,
      priority: 'URGENT',
      status: 'PURCHASED',
      store_location: 'Con Cưng',
      target_date: today,
      assigned_to: 'Mẹ',
      notes: 'Đã mua tại Con Cưng có khuyến mãi',
      purchased_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sample-shop-4',
      family_id: familyId,
      title: 'Dầu hào Maggi chai 530g',
      category: 'GROCERY',
      quantity: 1,
      unit: 'chai',
      estimated_price: 38000,
      actual_price: null,
      priority: 'NORMAL',
      status: 'PENDING',
      store_location: 'Chợ truyền thống',
      target_date: null,
      assigned_to: 'Bố',
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sample-shop-5',
      family_id: familyId,
      title: 'Pin AA Panasonic Eneloop sạc lại',
      category: 'ELECTRONICS',
      quantity: 1,
      unit: 'vỉ',
      estimated_price: 320000,
      actual_price: null,
      priority: 'LOW',
      status: 'PENDING',
      store_location: 'Shopee',
      target_date: null,
      assigned_to: 'Bố',
      notes: 'Dùng cho đồ chơi và điều khiển',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}
