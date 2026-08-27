import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
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
            Tạo tài khoản mới
          </p>
        </div>

        <div class="card">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Đăng ký
          </h2>

          @if (errorMessage()) {
            <div class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-600 dark:text-red-400">
                {{ errorMessage() }}
              </p>
            </div>
          }

          @if (successMessage()) {
            <div class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p class="text-sm text-green-600 dark:text-green-400">
                {{ successMessage() }}
              </p>
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="space-y-4">
              <div>
                <label class="label">Họ và tên</label>
                <input
                  type="text"
                  formControlName="fullName"
                  class="input"
                  placeholder="Nguyễn Văn A"
                />
                @if (registerForm.get('fullName')?.hasError('required') && registerForm.get('fullName')?.touched) {
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                    Họ tên là bắt buộc
                  </p>
                }
              </div>

              <div>
                <label class="label">Email</label>
                <input
                  type="email"
                  formControlName="email"
                  class="input"
                  placeholder="your@email.com"
                />
                @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                    Email là bắt buộc
                  </p>
                }
                @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
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
                />
                @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                    Mật khẩu là bắt buộc
                  </p>
                }
                @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </p>
                }
              </div>

              <div>
                <label class="label">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  formControlName="confirmPassword"
                  class="input"
                  placeholder="••••••••"
                />
                @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                    Mật khẩu không khớp
                  </p>
                }
              </div>

              <button
                type="submit"
                class="btn btn-primary w-full"
                [disabled]="loading() || registerForm.invalid"
              >
                @if (loading()) {
                  <span>Đang đăng ký...</span>
                } @else {
                  <span>Đăng ký</span>
                }
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <p class="text-gray-600 dark:text-gray-400">
              Đã có tài khoản?
              <a routerLink="/login" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                Đăng nhập
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const { email, password, fullName } = this.registerForm.value;
      await this.authService.signUp(email, password, fullName);
      
      this.successMessage.set('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (error: any) {
      console.error('Register error:', error);
      this.errorMessage.set(
        error.message.includes('already registered')
          ? 'Email đã được sử dụng'
          : 'Đã xảy ra lỗi. Vui lòng thử lại.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}