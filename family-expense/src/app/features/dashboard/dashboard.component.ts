import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EChartsOption } from 'echarts';
import { FamilyRepository } from '../../core/services/family.repository';
import { TransactionRepository } from '../../core/services/transaction.repository';
import { CategoryRepository } from '../../core/services/category.repository';
import { AuthService } from '../../core/auth/auth.service';
import { NgxEchartsModule, NgxEchartsDirective } from 'ngx-echarts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxEchartsDirective],
  template: `
    <div class="p-4 md:p-6 lg:p-8">
      @if (!currentFamily()) {
        <div class="card text-center">
          <h2 class="text-2xl font-bold mb-4">Chào mừng! 👋</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Bạn chưa có gia đình nào. Hãy tạo gia đình đầu tiên để bắt đầu quản lý chi tiêu.
          </p>
          <button routerLink="/family" class="btn btn-primary">
            Tạo gia đình
          </button>
        </div>
      } @else {
        <!-- Welcome header -->
        <div class="mb-8">
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">

            Xin chào, {{ user()?.email?.split('@')?.[0] || 'User' }} 👋
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ currentMonth() }}
          </p>
        </div>

        <!-- Stats cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                  Tổng thu
                </p>
                <p class="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300">
                  {{ formatCurrency(stats().totalIncome) }}
                </p>
              </div>
              <div class="text-4xl">💰</div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
                  Tổng chi
                </p>
                <p class="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-300">
                  {{ formatCurrency(stats().totalExpense) }}
                </p>
              </div>
              <div class="text-4xl">💸</div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                  Số dư
                </p>
                <p class="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {{ formatCurrency(stats().balance) }}
                </p>
              </div>
              <div class="text-4xl">💵</div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Expense by category -->
          <div class="card">
            <h3 class="text-lg font-bold mb-4">Chi tiêu theo danh mục</h3>
            @if (categoryChartOption()) {
              <div echarts [options]="categoryChartOption()" class="h-80"></div>
            } @else {
              <div class="h-80 flex items-center justify-center text-gray-400">
                Chưa có dữ liệu
              </div>
            }
          </div>

          <!-- Income vs Expense trend -->
          <div class="card">
            <h3 class="text-lg font-bold mb-4">Thu chi tháng này</h3>
            @if (trendChartOption()) {
              <div echarts [options]="trendChartOption()" class="h-80"></div>
            } @else {
              <div class="h-80 flex items-center justify-center text-gray-400">
                Chưa có dữ liệu
              </div>
            }
          </div>
        </div>

        <!-- Recent transactions -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold">Giao dịch gần đây</h3>
            <a routerLink="/transactions" class="text-primary-600 dark:text-primary-400 text-sm hover:underline">
              Xem tất cả
            </a>
          </div>

          @if (recentTransactions().length > 0) {
            <div class="space-y-3">
              @for (transaction of recentTransactions(); track transaction.id) {
                <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="text-2xl">
                      {{ transaction.category?.icon }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ transaction.category?.name }}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ transaction.note || 'Không có ghi chú' }}
                      </p>
                      <p class="text-xs text-gray-400 dark:text-gray-500">
                        {{ formatDate(transaction.transaction_date) }}
                      </p>
                    </div>
                  </div>
                  <div [class]="transaction.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    <p class="font-bold">

                      {{ transaction.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(+transaction.amount) }}
                    </p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-8 text-gray-400">
              <p>Chưa có giao dịch nào</p>
              <button routerLink="/transactions/new" class="btn btn-primary mt-4">
                Thêm giao dịch đầu tiên
              </button>
            </div>
          }
        </div>

        <!-- Quick action button (Mobile FAB) -->
        <div class="fixed bottom-20 right-4 lg:hidden z-10">
          <button
            routerLink="/transactions/new"
            class="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-primary-700 transition-colors"
          >
            ➕
          </button>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentFamily;
  user;
  transactions;

  stats = computed(() => {
    const trans = this.transactions();
    const totalIncome = trans
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = trans
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  });

  recentTransactions = computed(() => {
    return this.transactions().slice(0, 5);
  });

  categoryChartOption = computed<EChartsOption>(() => {
    const trans = this.transactions()
      .filter(t => t.type === 'EXPENSE');

    if (trans.length === 0) {
      return {
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value'
        },
        series: []
      };
    }

    const categoryTotals = new Map<
      string,
      {
        name: string;
        value: number;
        color: string;
      }
    >();

    trans.forEach(t => {

      if (!t.category) {
        return;
      }

      const existing = categoryTotals.get(t.category.id) ?? {
        name: t.category.name,
        value: 0,
        color: t.category.color
      };

      existing.value += parseFloat(t.amount);

      categoryTotals.set(
        t.category.id,
        existing
      );
    });

    const data = Array.from(categoryTotals.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const option: EChartsOption = {

      tooltip: {
        trigger: 'item',

        formatter: (params: any) => {
          return `
          ${params.name}<br/>
          ${this.formatCurrency(params.value)}
          (${params.percent}%)
        `;
        }
      },

      legend: {
        bottom: 0,
        left: 'center'
      },

      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,

          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },

          label: {
            show: false
          },

          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },

          data
        }
      ]
    };

    return option;
  });

  trendChartOption = computed<EChartsOption>(() => {
    const trans = this.transactions();

    if (trans.length === 0) {
      return {
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value'
        },
        series: []
      };
    }

    const dailyData = new Map<
      string,
      { income: number; expense: number }
    >();

    trans.forEach(t => {
      const date = t.transaction_date;

      const existing =
        dailyData.get(date) ?? {
          income: 0,
          expense: 0
        };

      if (t.type === 'INCOME') {
        existing.income += parseFloat(t.amount);
      } else {
        existing.expense += parseFloat(t.amount);
      }

      dailyData.set(date, existing);
    });

    const sortedDates =
      Array.from(dailyData.keys()).sort();

    const dates = sortedDates.slice(-7);

    const income = dates.map(
      d => dailyData.get(d)!.income
    );

    const expense = dates.map(
      d => dailyData.get(d)!.expense
    );

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },

      legend: {
        data: ['Thu', 'Chi']
      },

      xAxis: {
        type: 'category',
        data: dates.map(
          d => new Date(d).getDate()
        )
      },

      yAxis: {
        type: 'value'
      },

      series: [
        {
          name: 'Thu',
          type: 'bar',
          data: income,
          itemStyle: {
            color: '#10B981'
          }
        },
        {
          name: 'Chi',
          type: 'bar',
          data: expense,
          itemStyle: {
            color: '#EF4444'
          }
        }
      ]
    };
  });
  currentMonth = computed(() => {
    const now = new Date();
    return `Tháng ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  });

  constructor(
    private familyRepo: FamilyRepository,
    private transactionRepo: TransactionRepository,
    private categoryRepo: CategoryRepository,
    private authService: AuthService
  ) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.user = this.authService.user;
    this.transactions = this.transactionRepo.allTransactions;
  }

  async ngOnInit() {
    const family = this.currentFamily();
    if (family) {
      await this.loadData(family.id);
    }
  }

  ngOnDestroy() {
    this.transactionRepo.unsubscribeFromTransactions();
  }

  private async loadData(familyId: string) {
    try {
      await this.categoryRepo.loadCategories(familyId);
      await this.transactionRepo.loadTransactions(familyId);

      // Subscribe to realtime updates
      this.transactionRepo.subscribeToTransactions(familyId, () => {
        this.transactionRepo.loadTransactions(familyId);
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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