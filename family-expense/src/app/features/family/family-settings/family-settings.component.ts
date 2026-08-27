import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FamilyRepository } from '../../../core/services/family.repository';

@Component({
  selector: 'app-family-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 class="text-2xl md:text-3xl font-bold mb-6">Gia đình</h1>

      @if (currentFamily()) {
        <div class="space-y-6">
          <!-- Current Family -->
          <div class="card">
            <h3 class="text-lg font-bold mb-4">Thông tin gia đình</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-500">Tên gia đình</p>
                <p class="font-medium">{{ currentFamily()?.name }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Tiền tệ</p>
                <p class="font-medium">{{ currentFamily()?.currency }}</p>
              </div>
            </div>
            <div class="mt-4">
              <button routerLink="/family/members" class="btn btn-primary">
                Quản lý thành viên
              </button>
            </div>
          </div>

          <!-- Create New Family -->
          <div class="card">
            <h3 class="text-lg font-bold mb-4">Tạo gia đình mới</h3>
            <form [formGroup]="familyForm" (ngSubmit)="onSubmit()">
              <div class="space-y-4">
                <div>
                  <label class="label">Tên gia đình</label>
                  <input
                    type="text"
                    formControlName="name"
                    class="input"
                    placeholder="Gia đình Nguyễn"
                  />
                </div>
                <div>
                  <label class="label">Tên hiển thị của bạn</label>
                  <input
                    type="text"
                    formControlName="displayName"
                    class="input"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="loading() || familyForm.invalid"
                >
                  {{ loading() ? 'Đang tạo...' : 'Tạo gia đình' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      } @else {
        <div class="card text-center py-12">
          <h2 class="text-xl font-bold mb-4">Tạo gia đình đầu tiên</h2>
          <form [formGroup]="familyForm" (ngSubmit)="onSubmit()" class="max-w-md mx-auto">
            <div class="space-y-4">
              <div>
                <label class="label">Tên gia đình</label>
                <input
                  type="text"
                  formControlName="name"
                  class="input"
                  placeholder="Gia đình Nguyễn"
                />
              </div>
              <div>
                <label class="label">Tên hiển thị của bạn</label>
                <input
                  type="text"
                  formControlName="displayName"
                  class="input"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <button
                type="submit"
                class="btn btn-primary w-full"
                [disabled]="loading() || familyForm.invalid"
              >
                {{ loading() ? 'Đang tạo...' : 'Tạo gia đình' }}
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class FamilySettingsComponent implements OnInit {
  currentFamily;
  familyForm: FormGroup;
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private familyRepo: FamilyRepository
  ) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.familyForm = this.fb.group({
      name: ['', Validators.required],
      displayName: ['', Validators.required]
    });
  }

  async ngOnInit() {
    await this.familyRepo.loadFamilies();
  }

  async onSubmit() {
    if (this.familyForm.invalid) return;

    this.loading.set(true);

    try {
      const { name, displayName } = this.familyForm.value;
      await this.familyRepo.createFamily(name, displayName);
      this.familyForm.reset();
    } catch (error) {
      console.error('Error creating family:', error);
      alert('Đã xảy ra lỗi khi tạo gia đình');
    } finally {
      this.loading.set(false);
    }
  }
}