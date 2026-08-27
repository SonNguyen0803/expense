import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="card max-w-md w-full">
        <h2 class="text-2xl font-bold mb-4">Quên mật khẩu</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Tính năng đang được phát triển
        </p>
        <a routerLink="/login" class="btn btn-primary w-full">
          Quay lại đăng nhập
        </a>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {}