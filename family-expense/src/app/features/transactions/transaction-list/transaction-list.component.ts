import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FamilyRepository } from '../../../core/services/family.repository';
import { TransactionRepository } from '../../../core/services/transaction.repository';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 md:p-6 lg:p-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl md:text-3xl font-bold">Giao dịch</h1>
        <button routerLink="/transactions/new" class="btn btn-primary">
          ➕ Thêm giao dịch
        </button>
      </div>

      @if (transactions().length > 0) {
        <div class="card">
          <div class="space-y-3">
            @for (transaction of transactions(); track transaction.id) {
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

  constructor(
    private familyRepo: FamilyRepository,
    private transactionRepo: TransactionRepository
  ) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.transactions = this.transactionRepo.allTransactions;
  }

  async ngOnInit() {
    const family = this.currentFamily();
    if (family) {
      await this.transactionRepo.loadTransactions(family.id);
    }
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
}