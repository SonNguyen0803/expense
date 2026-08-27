import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyRepository } from '../../core/services/family.repository';
import { CategoryRepository } from '../../core/services/category.repository';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl md:text-3xl font-bold">Danh mục</h1>
        <button class="btn btn-primary">➕ Thêm danh mục</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Expense categories -->
        <div class="card">
          <h3 class="text-lg font-bold mb-4">Chi tiêu</h3>
          <div class="space-y-2">
            @for (category of expenseCategories(); track category.id) {
              <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ category.icon }}</span>
                  <span>{{ category.name }}</span>
                </div>
                @if (!category.is_default) {
                  <button class="text-red-600 hover:text-red-700">🗑️</button>
                }
              </div>
            }
          </div>
        </div>

        <!-- Income categories -->
        <div class="card">
          <h3 class="text-lg font-bold mb-4">Thu nhập</h3>
          <div class="space-y-2">
            @for (category of incomeCategories(); track category.id) {
              <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ category.icon }}</span>
                  <span>{{ category.name }}</span>
                </div>
                @if (!category.is_default) {
                  <button class="text-red-600 hover:text-red-700">🗑️</button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class CategoriesComponent implements OnInit {
  currentFamily: any;
  categories: any;

  expenseCategories = () => this.categories().filter((c : any) => c.type === 'EXPENSE');
  incomeCategories = () => this.categories().filter((c : any) => c.type === 'INCOME');

  constructor(
    private familyRepo: FamilyRepository,
    private categoryRepo: CategoryRepository
  ) { }

  async ngOnInit() {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.categories = this.categoryRepo.allCategories;
    const family = this.currentFamily();
    if (family) {
      await this.categoryRepo.loadCategories(family.id);
    }
  }
}