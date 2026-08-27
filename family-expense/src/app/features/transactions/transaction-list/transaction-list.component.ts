import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FamilyRepository } from '../../../core/services/family.repository';
import { TransactionRepository } from '../../../core/services/transaction.repository';
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
    <div class="p-4 md:p-6 lg:p-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl md:text-3xl font-bold">Giao dịch</h1>
        <div class="flex items-center gap-2">
          <button (click)="prevMonth()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            ←
          </button>
          <span class="font-semibold">{{ formatMonthYear(currentMonth()) }}</span>
          <button (click)="nextMonth()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            →
          </button>
        </div>
        <button routerLink="/transactions/new" class="btn btn-primary">
          ➕ Thêm giao dịch
        </button>
      </div>

      @if (filteredTransactions().length > 0) {
        <div class="card">
          <div class="p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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

          <div class="space-y-3">
            @for (transaction of filteredTransactions(); track transaction.id) {
              <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <div class="flex items-center gap-3">
                  <div class="text-2xl">{{ transaction.category?.icon }}</div>
                  <div>
                    <p class="font-medium">{{ transaction.category?.name }}</p>
                    <p class="text-sm text-gray-500">{{ transaction.note || 'Không có ghi chú' }}</p>
                    <p class="text-xs text-gray-400">{{ formatDate(transaction.transaction_date) }}</p>
                  </div>
                </div>
                <div [class]="transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'">
                  <p class="font-bold">
                    {{ transaction.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(+transaction.amount) }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="card text-center py-12">
          <p class="text-gray-400 mb-4">Chưa có giao dịch nào</p>
          <button routerLink="/transactions/new" class="btn btn-primary">
            Thêm giao dịch đầu tiên
          </button>
        </div>
      }
    </div>
  `
})
export class TransactionListComponent implements OnInit {
  currentFamily;
  transactions;
  currentMonth = signal(new Date());

  constructor(
    private familyRepo: FamilyRepository,
    private transactionRepo: TransactionRepository
  ) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.transactions = this.transactionRepo.allTransactions;
    effect(() => {
      const family = this.currentFamily();
      if (family?.id) {
        this.transactionRepo.loadTransactions(family.id);
      }
    });
  }

  filteredTransactions = computed(() => {
    const trans = this.transactions();
    const month = this.currentMonth();
    return filterTransactionsByMonth(
      trans,
      month.getFullYear(),
      month.getMonth()
    );
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
    const family = this.currentFamily();
    if (family) {
      await this.transactionRepo.loadTransactions(family.id);
    }
  }

  prevMonth() {
    this.currentMonth.set(addMonths(this.currentMonth(), -1));
  }

  nextMonth() {
    this.currentMonth.set(addMonths(this.currentMonth(), 1));
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
}