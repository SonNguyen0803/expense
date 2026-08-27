import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8">
      <h1 class="text-2xl md:text-3xl font-bold mb-6">Ngân sách</h1>
      
      <div class="card text-center py-12">
        <p class="text-gray-400 mb-4">Tính năng đang được phát triển</p>
        <p class="text-sm text-gray-500">
          Sẽ cho phép thiết lập ngân sách theo danh mục và theo dõi chi tiêu
        </p>
      </div>
    </div>
  `
})
export class BudgetsComponent {}