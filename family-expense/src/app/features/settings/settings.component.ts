import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 class="text-2xl md:text-3xl font-bold mb-6">Cài đặt</h1>

      <div class="space-y-6">
        <!-- Profile -->
        <div class="card">
          <h3 class="text-lg font-bold mb-4">Thông tin cá nhân</h3>
          <div class="space-y-3">
            <div>
              <p class="text-sm text-gray-500">Email</p>
              <p class="font-medium">{{ user()?.email }}</p>
            </div>
          </div>
        </div>

        <!-- Theme -->
        <div class="card">
          <h3 class="text-lg font-bold mb-4">Giao diện</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer">
              <input type="radio" name="theme" value="light" class="w-4 h-4">
              <span>☀️ Sáng</span>
            </label>
            <label class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer">
              <input type="radio" name="theme" value="dark" class="w-4 h-4">
              <span>🌙 Tối</span>
            </label>
            <label class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer">
              <input type="radio" name="theme" value="system" class="w-4 h-4" checked>
              <span>💻 Theo hệ thống</span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="card">
          <h3 class="text-lg font-bold mb-4">Hành động</h3>
          <div class="space-y-3">
            <button routerLink="/family" class="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
              👨‍👩‍👧‍👦 Quản lý gia đình
            </button>
            <button (click)="logout()" class="w-full text-left p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  user;

  constructor(private authService: AuthService) {
    this.user = this.authService.user;
  }

  async logout() {
    await this.authService.signOut();
  }
}