import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FamilyRepository } from '../../../core/services/family.repository';
import { TransactionRepository } from '../../../core/services/transaction.repository';
import { CategoryRepository } from '../../../core/services/category.repository';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 class="text-2xl md:text-3xl font-bold mb-6">
        {{ isEditMode() ? 'Sửa giao dịch' : 'Thêm giao dịch' }}
      </h1>

      <div class="card">
        <form [formGroup]="transactionForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label class="label">Loại</label>
              <select formControlName="type" class="input">
                <option value="EXPENSE">Chi tiêu</option>
                <option value="INCOME">Thu nhập</option>
              </select>
            </div>

            <div>
              <label class="label">Số tiền</label>
              <input
                type="number"
                formControlName="amount"
                class="input"
                placeholder="0"
              />
            </div>

            <div>
              <label class="label">Danh mục</label>
              <select formControlName="category_id" class="input">
                <option value="">Chọn danh mục</option>
                @for (category of filteredCategories(); track category.id) {
                  <option [value]="category.id">{{ category.icon }} {{ category.name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="label">Người chi</label>
              <select formControlName="member_id" class="input">
                <option value="">Chọn người chi</option>
                @for (member of members(); track member.id) {
                  <option [value]="member.id">{{ member.display_name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="label">Ngày</label>
              <input
                type="date"
                formControlName="transaction_date"
                class="input"
              />
            </div>

            <div>
              <label class="label">Ghi chú</label>
              <textarea
                formControlName="note"
                class="input"
                rows="3"
                placeholder="Thêm ghi chú..."
              ></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                (click)="cancel()"
                class="btn btn-secondary flex-1"
              >
                Hủy
              </button>
              @if (isEditMode()) {
                <button
                  type="button"
                  (click)="deleteTransaction()"
                  class="btn bg-red-600 hover:bg-red-700 text-white"
                  [disabled]="loading()"
                >
                  Xóa
                </button>
              }
              <button
                type="submit"
                class="btn btn-primary flex-1"
                [disabled]="loading() || transactionForm.invalid"
              >
                {{ loading() ? 'Đang lưu...' : 'Lưu' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
})
export class TransactionFormComponent implements OnInit {
  transactionForm: FormGroup;
  loading = signal(false);
  isEditMode = signal(false);
  transactionId: string | null = null;
  
  currentFamily;
  categories;
  members;
  
  filteredCategories = signal<any[]>([]);

  constructor(
    private fb: FormBuilder,
    private familyRepo: FamilyRepository,
    private transactionRepo: TransactionRepository,
    private categoryRepo: CategoryRepository,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.categories = this.categoryRepo.allCategories;
    this.members = this.familyRepo.familyMembers;
    this.transactionForm = this.fb.group({
      type: ['EXPENSE', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      category_id: ['', Validators.required],
      member_id: ['', Validators.required],
      transaction_date: [new Date().toISOString().split('T')[0], Validators.required],
      note: ['']
    });

    this.transactionForm.get('type')?.valueChanges.subscribe(type => {
      this.updateFilteredCategories(type);
    });
  }

  async ngOnInit() {
    let family = this.currentFamily();
    if (!family) {
      const families = await this.familyRepo.loadFamilies();
      family = families && families.length > 0 ? families[0] : null;
    }

    if (family) {
      await this.categoryRepo.loadCategories(family.id);
      await this.familyRepo.loadMembers(family.id);
    }

    // Check if we're in edit mode
    this.transactionId = this.route.snapshot.paramMap.get('id');
    if (this.transactionId) {
      this.isEditMode.set(true);
      await this.loadTransaction(this.transactionId);
    } else {
      // Create mode: initialize filtered categories and set default category to "Ăn uống"
      this.updateFilteredCategories(this.transactionForm.get('type')?.value, true);

      const currentMember = await this.familyRepo.getCurrentMember();
      if (currentMember) {
        this.transactionForm.patchValue({ member_id: currentMember.id });
      }
    }
  }

  async loadTransaction(id: string) {
    try {
      this.loading.set(true);
      const transaction = await this.transactionRepo.getTransactionById(id);
      
      if (transaction) {
        this.transactionForm.patchValue({
          type: transaction.type,
          amount: transaction.amount,
          category_id: transaction.category_id,
          member_id: transaction.member_id,
          transaction_date: transaction.transaction_date,
          note: transaction.note || ''
        });
        
        // Update filtered categories based on loaded type
        this.updateFilteredCategories(transaction.type);
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
      alert('Không thể tải thông tin giao dịch');
      this.router.navigate(['/transactions']);
    } finally {
      this.loading.set(false);
    }
  }

  updateFilteredCategories(type: string, isInitial = false) {
    const filtered = this.categories().filter(c => c.type === type);
    this.filteredCategories.set(filtered);

    // When creating a new transaction, default to "Ăn uống" if available
    if (!this.isEditMode()) {
      const currentCatId = this.transactionForm.get('category_id')?.value;
      const isCurrentCatValid = filtered.some(c => c.id === currentCatId);

      if (isInitial || !currentCatId || !isCurrentCatValid) {
        if (type === 'EXPENSE') {
          const diningCategory = filtered.find(c => this.isDiningCategory(c.name));
          this.transactionForm.patchValue({
            category_id: diningCategory ? diningCategory.id : (filtered[0]?.id || '')
          });
        } else {
          this.transactionForm.patchValue({
            category_id: filtered[0]?.id || ''
          });
        }
      }
    }
  }

  private isDiningCategory(name: string): boolean {
    if (!name) return false;
    const lower = name.toLowerCase().trim();
    if (lower === 'ăn uống' || lower.includes('ăn uống')) return true;
    const stripped = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return stripped === 'an uong' || stripped.includes('an uong');
  }

  async onSubmit() {
    if (this.transactionForm.invalid) return;

    this.loading.set(true);

    try {
      const family = this.currentFamily();
      const user = this.authService.user();
      
      if (!family || !user) throw new Error('Missing family or user');

      const formValue = this.transactionForm.value;
      
      const am = formValue.amount * 1000; // Convert to the expected format
      if (this.isEditMode() && this.transactionId) {
        // Update existing transaction
        await this.transactionRepo.updateTransaction(this.transactionId, {
          category_id: formValue.category_id,
          member_id: formValue.member_id,
          type: formValue.type,
          amount: am.toString(),
          note: formValue.note,
          transaction_date: formValue.transaction_date
        });
      } else {
        // Create new transaction
        await this.transactionRepo.createTransaction({
          family_id: family.id,
          category_id: formValue.category_id,
          member_id: formValue.member_id,
          type: formValue.type,
          amount: am.toString(),
          note: formValue.note,
          transaction_date: formValue.transaction_date,
          created_by: user.id
        });
      }

      this.router.navigate(['/transactions']);
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Đã xảy ra lỗi khi lưu giao dịch');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteTransaction() {
    if (!this.transactionId) return;
    
    const confirmed = confirm('Bạn có chắc chắn muốn xóa giao dịch này?');
    if (!confirmed) return;

    try {
      this.loading.set(true);
      await this.transactionRepo.deleteTransaction(this.transactionId);
      this.router.navigate(['/transactions']);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Đã xảy ra lỗi khi xóa giao dịch');
    } finally {
      this.loading.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/transactions']);
  }
}