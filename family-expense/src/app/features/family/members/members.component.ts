import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FamilyRepository } from '../../../core/services/family.repository';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 class="text-2xl md:text-3xl font-bold mb-6">Thành viên</h1>

      @if (currentFamily()) {
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold">{{ currentFamily()?.name }}</h3>
            <button class="btn btn-primary text-sm">➕ Mời thành viên</button>
          </div>

          <div class="space-y-3">
            @for (member of members(); track member.id) {
              <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <div>
                  <p class="font-medium">{{ member.display_name }}</p>
                  <p class="text-sm text-gray-500">{{ member.role }}</p>
                </div>
                @if (member.role !== 'OWNER') {
                  <button class="text-red-600 hover:text-red-700 text-sm">Xóa</button>
                }
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="card text-center py-12">
          <p class="text-gray-400 mb-4">Không tìm thấy gia đình</p>
          <button routerLink="/family" class="btn btn-primary">
            Quay lại
          </button>
        </div>
      }
    </div>
  `
})
export class MembersComponent implements OnInit {
  currentFamily;
  members;

  constructor(private familyRepo: FamilyRepository) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.members = this.familyRepo.familyMembers;
  }

  async ngOnInit() {
    const family = this.currentFamily();
    if (family) {
      await this.familyRepo.loadMembers(family.id);
    }
  }
}