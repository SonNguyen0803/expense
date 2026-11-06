import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FamilyRepository } from '../../core/services/family.repository';
import { AuthService } from '../../core/auth/auth.service';
import { ShoppingRepository } from '../../core/services/shopping.repository';
import { TransactionRepository } from '../../core/services/transaction.repository';
import { CategoryRepository } from '../../core/services/category.repository';
import {
  ShoppingItem,
  ShoppingItemStatus,
  ShoppingCategory,
  ShoppingPriority
} from '../../core/models';
import {
  SHOPPING_CATEGORIES,
  SHOPPING_STATUSES,
  SHOPPING_PRIORITIES,
  COMMON_UNITS,
  POPULAR_STORES,
  getShoppingCategoryMeta,
  getShoppingStatusMeta,
  getShoppingPriorityMeta
} from '../../core/utils/shopping.util';
import { formatVND } from '../../core/utils/asset.util';
import { formatDateDDMMYYYY } from '../../core/utils/date.util';

type StatusFilter = 'ALL' | ShoppingItemStatus;

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './shopping-list.component.html'
})
export class ShoppingListComponent implements OnInit {
  currentFamily;
  currentUser;

  // Repository signals
  items;
  loading;
  summary;

  // View state
  shoppingMode = signal<boolean>(false); // High-contrast, large-checkbox shopping mode
  statusFilter = signal<StatusFilter>('ALL');
  categoryFilter = signal<string>('ALL');
  priorityFilter = signal<string>('ALL');
  storeFilter = signal<string>('ALL');
  searchQuery = signal<string>('');

  // Quick Add input state
  quickTitle = signal<string>('');
  quickCategory = signal<ShoppingCategory>('GROCERY');

  // Modals state
  showItemModal = signal<boolean>(false);
  isEditItem = signal<boolean>(false);
  editingItemId = signal<string | null>(null);

  showPurchaseModal = signal<boolean>(false);
  purchasingItem = signal<ShoppingItem | null>(null);

  showDeleteConfirm = signal<boolean>(false);
  deleteTarget = signal<ShoppingItem | null>(null);

  showClearConfirm = signal<boolean>(false);

  // Forms
  itemForm: FormGroup;
  purchaseForm: FormGroup;

  // Constants for template
  categories = SHOPPING_CATEGORIES;
  statuses = SHOPPING_STATUSES;
  priorities = SHOPPING_PRIORITIES;
  commonUnits = COMMON_UNITS;
  popularStores = POPULAR_STORES;

  // Helpers
  getCategoryMeta = getShoppingCategoryMeta;
  getStatusMeta = getShoppingStatusMeta;
  getPriorityMeta = getShoppingPriorityMeta;
  formatVND = formatVND;
  formatDate = formatDateDDMMYYYY;

  // Filtered Items computed
  filteredItems = computed(() => {
    let list = [...this.items()];
    const query = this.searchQuery().trim().toLowerCase();
    const st = this.statusFilter();
    const cat = this.categoryFilter();
    const prio = this.priorityFilter();
    const store = this.storeFilter();

    // If shopping mode is ON, show only PENDING and BUYING items
    if (this.shoppingMode()) {
      list = list.filter(i => i.status === 'PENDING' || i.status === 'BUYING');
    } else if (st !== 'ALL') {
      list = list.filter(i => i.status === st);
    }

    if (query) {
      list = list.filter(i =>
        i.title.toLowerCase().includes(query) ||
        (i.store_location && i.store_location.toLowerCase().includes(query)) ||
        (i.notes && i.notes.toLowerCase().includes(query)) ||
        (i.assigned_to && i.assigned_to.toLowerCase().includes(query))
      );
    }

    if (cat !== 'ALL') {
      list = list.filter(i => i.category === cat);
    }

    if (prio !== 'ALL') {
      list = list.filter(i => i.priority === prio);
    }

    if (store !== 'ALL') {
      list = list.filter(i => i.store_location === store);
    }

    // Sort order: URGENT first, then PENDING/BUYING before PURCHASED/CANCELLED
    const priorityWeights: Record<ShoppingPriority, number> = {
      URGENT: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1
    };

    const statusWeights: Record<ShoppingItemStatus, number> = {
      BUYING: 4,
      PENDING: 3,
      PURCHASED: 2,
      CANCELLED: 1
    };

    list.sort((a, b) => {
      // First sort by status urgency (BUYING & PENDING first)
      const stDiff = statusWeights[b.status] - statusWeights[a.status];
      if (stDiff !== 0) return stDiff;

      // Next sort by priority
      const prioDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
      if (prioDiff !== 0) return prioDiff;

      // Next by date created desc
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  });

  // Progress percentage
  progressPercent = computed(() => {
    const total = this.summary().totalItems;
    if (total === 0) return 0;
    return Math.round((this.summary().purchasedCount / total) * 100);
  });

  constructor(
    public shoppingRepo: ShoppingRepository,
    private familyRepo: FamilyRepository,
    private authService: AuthService,
    private transactionRepo: TransactionRepository,
    private categoryRepo: CategoryRepository,
    private fb: FormBuilder
  ) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.currentUser = this.authService.user;
    this.items = this.shoppingRepo.items;
    this.loading = this.shoppingRepo.loading;
    this.summary = this.shoppingRepo.summary;

    // Item Form
    this.itemForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      category: ['GROCERY', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.1)]],
      unit: ['món', Validators.required],
      estimated_price: [0, [Validators.min(0)]],
      priority: ['NORMAL', Validators.required],
      status: ['PENDING', Validators.required],
      store_location: [''],
      target_date: [''],
      assigned_to: [''],
      notes: ''
    });

    // Purchase Form (when marking as purchased)
    this.purchaseForm = this.fb.group({
      actual_price: [0, [Validators.required, Validators.min(0)]],
      create_transaction: [true] // Option to automatically create a transaction
    });
  }

  ngOnInit() {
    const family = this.currentFamily();
    if (family) {
      this.shoppingRepo.loadItems(family.id);
    }
  }

  // ==========================================
  // Quick Add Item
  // ==========================================

  async onQuickAdd() {
    const title = this.quickTitle().trim();
    const family = this.currentFamily();
    if (!title || !family) return;

    await this.shoppingRepo.quickAddItem(family.id, title, this.quickCategory());
    this.quickTitle.set('');
  }

  // ==========================================
  // Status Changing Interactions
  // ==========================================

  async togglePurchased(item: ShoppingItem) {
    const family = this.currentFamily();
    if (!family) return;

    if (item.status !== 'PURCHASED') {
      // Open quick price confirmation modal so user can confirm or adjust price
      this.openPurchaseModal(item);
    } else {
      // Revert back to PENDING
      await this.shoppingRepo.changeStatus(item.id, family.id, 'PENDING');
    }
  }

  async setStatus(item: ShoppingItem, newStatus: ShoppingItemStatus) {
    const family = this.currentFamily();
    if (!family) return;

    if (newStatus === 'PURCHASED') {
      this.openPurchaseModal(item);
    } else {
      await this.shoppingRepo.changeStatus(item.id, family.id, newStatus);
    }
  }

  openPurchaseModal(item: ShoppingItem) {
    this.purchasingItem.set(item);
    this.purchaseForm.patchValue({
      actual_price: item.actual_price || item.estimated_price || 0,
      create_transaction: true
    });
    this.showPurchaseModal.set(true);
  }

  closePurchaseModal() {
    this.showPurchaseModal.set(false);
    this.purchasingItem.set(null);
  }

  async confirmPurchase() {
    const item = this.purchasingItem();
    const family = this.currentFamily();
    if (!item || !family) return;

    const actualPrice = Number(this.purchaseForm.get('actual_price')?.value || item.estimated_price || 0);
    const createTx = this.purchaseForm.get('create_transaction')?.value;

    await this.shoppingRepo.changeStatus(item.id, family.id, 'PURCHASED', actualPrice);

    // Optional: create expense transaction if chosen and price > 0
    if (createTx && actualPrice > 0) {
      try {
        const categories = this.categoryRepo.allCategories();
        // Look for matching or first expense category
        const expCat = categories.find(c => c.type === 'EXPENSE') || categories[0];
        if (expCat) {
          const user = this.currentUser();
          const userId = user?.id || family.owner_id;
          await this.transactionRepo.createTransaction({
            family_id: family.id,
            category_id: expCat.id,
            member_id: userId,
            created_by: userId,
            type: 'EXPENSE',
            amount: actualPrice.toString(),
            note: `Mua sắm: ${item.title} (${item.quantity} ${item.unit})`,
            transaction_date: new Date().toISOString().split('T')[0]
          });
        }
      } catch (err) {
        console.warn('Could not auto-create transaction:', err);
      }
    }

    this.closePurchaseModal();
  }

  // ==========================================
  // Detailed Add / Edit Modal
  // ==========================================

  openAddItemModal() {
    this.isEditItem.set(false);
    this.editingItemId.set(null);
    this.itemForm.reset({
      title: '',
      category: 'GROCERY',
      quantity: 1,
      unit: 'món',
      estimated_price: 0,
      priority: 'NORMAL',
      status: 'PENDING',
      store_location: '',
      target_date: new Date().toISOString().split('T')[0],
      assigned_to: '',
      notes: ''
    });
    this.showItemModal.set(true);
  }

  openEditItemModal(item: ShoppingItem) {
    this.isEditItem.set(true);
    this.editingItemId.set(item.id);
    this.itemForm.patchValue({
      title: item.title,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      estimated_price: item.estimated_price || 0,
      priority: item.priority,
      status: item.status,
      store_location: item.store_location || '',
      target_date: item.target_date || '',
      assigned_to: item.assigned_to || '',
      notes: item.notes || ''
    });
    this.showItemModal.set(true);
  }

  closeItemModal() {
    this.showItemModal.set(false);
    this.editingItemId.set(null);
  }

  async saveItem() {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const family = this.currentFamily();
    if (!family) return;

    const values = this.itemForm.value;

    if (this.isEditItem()) {
      const id = this.editingItemId();
      if (!id) return;
      await this.shoppingRepo.updateItem(id, family.id, values);
    } else {
      await this.shoppingRepo.createItem({
        ...values,
        family_id: family.id
      });
    }

    this.closeItemModal();
  }

  // ==========================================
  // Delete & Cleanup
  // ==========================================

  confirmDelete(item: ShoppingItem) {
    this.deleteTarget.set(item);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  async executeDelete() {
    const item = this.deleteTarget();
    const family = this.currentFamily();
    if (!item || !family) return;

    await this.shoppingRepo.deleteItem(item.id, family.id);
    this.closeDeleteConfirm();
  }

  confirmClearPurchased() {
    this.showClearConfirm.set(true);
  }

  closeClearConfirm() {
    this.showClearConfirm.set(false);
  }

  async executeClearPurchased() {
    const family = this.currentFamily();
    if (!family) return;

    await this.shoppingRepo.clearPurchased(family.id);
    this.closeClearConfirm();
  }

  toggleShoppingMode() {
    this.shoppingMode.set(!this.shoppingMode());
  }
}
