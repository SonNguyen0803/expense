import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
            💰 Chi tiêu
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Quản lý chi tiêu gia đình thông minh
          </p>
        </div>

        <div class="card">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Đăng nhập
          </h2>

          @if (errorMessage()) {
            <div class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-600 dark:text-red-400">
                {{ errorMessage() }}
              </p>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="space-y-4">
              <div>
                <label class="label">Email</label>
                <input
                  type="email"
                  formControlName="email"
                  class="input"
                  placeholder="your@email.com"
                  [class.border-red-500]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                />
                @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                    Email là bắt buộc
                  </p>
                }
                @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                    Email không hợp lệ
                  </p>
                }
              </div>

              <div>
                <label class="label">Mật khẩu</label>
                <input
                  type="password"
                  formControlName="password"
                  class="input"
                  placeholder="••••••••"
                  [class.border-red-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                />
                @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                    Mật khẩu là bắt buộc
                  </p>
                }
              </div>

              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2">
                  <input type="checkbox" class="rounded">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    Ghi nhớ đăng nhập
                  </span>
                </label>
                <a routerLink="/forgot-password" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  Quên mật khẩu?
                </a>
              </div>

              <button
                type="submit"
                class="btn btn-primary w-full"
                [disabled]="loading() || loginForm.invalid"
              >
                @if (loading()) {
                  <span>Đang đăng nhập...</span>
                } @else {
                  <span>Đăng nhập</span>
                }
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <p class="text-gray-600 dark:text-gray-400">
              Chưa có tài khoản?
              <a routerLink="/register" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                Đăng ký ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const { email, password } = this.loginForm.value;
      await this.authService.signIn(email, password);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMessage.set(
        error.message === 'Invalid login credentials'
          ? 'Email hoặc mật khẩu không đúng'
          : 'Đã xảy ra lỗi. Vui lòng thử lại.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}