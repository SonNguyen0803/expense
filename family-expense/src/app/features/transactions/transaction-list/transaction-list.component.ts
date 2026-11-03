import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FamilyRepository } from '../../../core/services/family.repository';
import { TransactionRepository } from '../../../core/services/transaction.repository';
import { TransactionWithDetails } from '../../../core/models';
import {
  filterTransactionsByMonth,
  formatMonthYear,
  addMonths
} from '../../../core/utils/date.util';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-3 md:p-6 lg:p-8">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl md:text-3xl font-bold">Giao dịch</h1>
        <button routerLink="/transactions/new" class="btn btn-primary">
          ➕ Thêm giao dịch
        </button>
      </div>

      <!-- Month Navigation & Filters -->
      <div class="card mb-4 !p-4">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <!-- Month Navigation -->
          <div class="flex items-center justify-between sm:justify-start gap-2">
            <button (click)="prevMonth()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              ← Prev
            </button>
            <span class="font-semibold text-center min-w-[120px]">{{ formatMonthYear(currentMonth()) }}</span>
            <button (click)="nextMonth()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Next →
            </button>
          </div>

          <!-- Creator Filter -->
          <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <label for="creatorFilter" class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              👤 Người tạo:
            </label>
            <div class="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <select
                id="creatorFilter"
                [value]="selectedCreator()"
                (change)="onCreatorChange($event)"
                class="input !w-full sm:!w-auto min-w-[150px] !py-1.5 !px-3 text-sm rounded-lg"
              >
                <option value="">Tất cả người tạo</option>
                @for (creator of creators(); track creator.id) {
                  <option [value]="creator.id">{{ creator.name }}</option>
                }
              </select>
              @if (selectedCreator()) {
                <button
                  type="button"
                  (click)="resetCreatorFilter()"
                  title="Xóa bộ lọc người tạo"
                  class="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  ✕
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      @if (filteredTransactions().length > 0) {
        <div class="card">
          <div class="p-2 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex justify-around">
              <div class="text-center">
                <p class="text-sm text-gray-500 dark:text-gray-400">Tổng thu</p>
                <p class="text-lg font-bold text-green-600">{{ formatCurrency(totalIncome()) }}</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-500 dark:text-gray-400">Tổng chi</p>
                <p class="text-lg font-bold text-red-600">{{ formatCurrency(totalExpense()) }}</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-500 dark:text-gray-400">Số dư</p>
                <p class="text-lg font-bold text-blue-600">{{ formatCurrency(balance()) }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-1">
            @for (transaction of filteredTransactions(); track transaction.id) {
              <div class="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer" (click)="editTransaction(transaction.id)">
                <div class="flex items-center gap-3">
                  <div class="text-2xl">{{ transaction.category?.icon }}</div>
                  <div>
                    <p class="font-medium">{{ transaction.category?.name }}</p>
                    <p class="text-sm text-gray-500">{{ transaction.note || 'Không có ghi chú' }}</p>
                    <p class="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <span>{{ formatDate(transaction.transaction_date) }}</span>
                      <span>•</span>
                      <span>Tạo bởi: <strong class="font-medium text-gray-600 dark:text-gray-300">{{ getCreatorName(transaction) }}</strong></span>
                    </p>
                  </div>
                </div>
                <div [class]="transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'">
                  <p class="font-bold">
                    {{ transaction.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(+transaction.amount) }}
                  </p>
                </div>
              </div>
              <hr>
            }
          </div>
        </div>
      } @else {
        <div class="card text-center py-12">
          <p class="text-gray-400 mb-4">
            {{ selectedCreator() ? 'Không tìm thấy giao dịch nào của người tạo này trong tháng' : 'Chưa có giao dịch nào' }}
          </p>
          <div class="flex justify-center gap-2">
            @if (selectedCreator()) {
              <button (click)="resetCreatorFilter()" class="btn btn-secondary">
                Xóa bộ lọc
              </button>
            }
            <button routerLink="/transactions/new" class="btn btn-primary">
              {{ selectedCreator() ? 'Thêm giao dịch mới' : 'Thêm giao dịch đầu tiên' }}
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class TransactionListComponent implements OnInit {
  currentFamily;
  transactions;
  members;
  currentMonth = signal(new Date());
  selectedCreator = signal<string>('');

  constructor(
    private familyRepo: FamilyRepository,
    private transactionRepo: TransactionRepository,
    private router: Router
  ) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.transactions = this.transactionRepo.allTransactions;
    this.members = this.familyRepo.familyMembers;

    effect(() => {
      const family = this.currentFamily();
      if (family?.id) {
        this.familyRepo.loadMembers(family.id);
        this.transactionRepo.loadTransactions(family.id);
      }
    });
  }

  creators = computed(() => {
    const list: { id: string; name: string }[] = [];
    const memberList = this.members();

    for (const m of memberList) {
      if (m.user_id && !list.some(x => x.id === m.user_id)) {
        list.push({ id: m.user_id, name: m.display_name });
      }
    }

    // Also include any creator from loaded transactions in case they are not in the current memberList
    const trans = this.transactions();
    for (const t of trans) {
      if (t.created_by && !list.some(x => x.id === t.created_by)) {
        const fallbackName = t.member?.display_name || 'Người dùng khác';
        list.push({ id: t.created_by, name: fallbackName });
      }
    }

    return list;
  });

  filteredTransactions = computed(() => {
    const trans = this.transactions();
    const month = this.currentMonth();
    const creator = this.selectedCreator();

    let result = filterTransactionsByMonth(
      trans,
      month.getFullYear(),
      month.getMonth()
    );

    if (creator) {
      result = result.filter(t =>
        t.created_by === creator ||
        (!t.created_by && t.member?.user_id === creator)
      );
    }

    return result;
  });

  totalIncome = computed(() => {
    return this.filteredTransactions()
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  });

  totalExpense = computed(() => {
    return this.filteredTransactions()
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  });

  balance = computed(() => {
    return this.totalIncome() - this.totalExpense();
  });

  async ngOnInit() {
    let family = this.currentFamily();
    if (!family) {
      const families = await this.familyRepo.loadFamilies();
      family = families && families.length > 0 ? families[0] : null;
    }
    if (family) {
      await this.familyRepo.loadMembers(family.id);
      await this.transactionRepo.loadTransactions(family.id);
    }
  }

  prevMonth() {
    this.currentMonth.set(addMonths(this.currentMonth(), -1));
  }

  nextMonth() {
    this.currentMonth.set(addMonths(this.currentMonth(), 1));
  }

  onCreatorChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCreator.set(target.value);
  }

  resetCreatorFilter() {
    this.selectedCreator.set('');
  }

  getCreatorName(transaction: TransactionWithDetails): string {
    if (transaction.created_by) {
      const member = this.members().find(m => m.user_id === transaction.created_by);
      if (member) {
        return member.display_name;
      }
    }
    if (transaction.member?.display_name) {
      return transaction.member.display_name;
    }
    return 'Người dùng';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN').format(date);
  }

  formatMonthYear(date: Date): string {
    return formatMonthYear(date);
  }

  editTransaction(transactionId: string) {
    this.router.navigate(['/transactions', transactionId, 'edit']);
  }
}