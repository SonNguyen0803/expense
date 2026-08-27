import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FamilyRepository } from '../../../core/services/family.repository';
import { EmailService } from '../../../core/services/email.service';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 class="text-2xl md:text-3xl font-bold mb-6">Thành viên</h1>

      @if (currentFamily()) {
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold">{{ currentFamily()?.name }}</h3>
            <button (click)="openInviteModal()" class="btn btn-primary text-sm">
              ➕ Mời thành viên
            </button>
          </div>

          <div class="space-y-3">
            @for (member of members(); track member.id) {
              <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <div>
                  <p class="font-medium">{{ member.display_name }}</p>
                  <p class="text-sm text-gray-500">{{ member.role }}</p>
                </div>
                @if (member.role !== 'OWNER') {
                  <button (click)="removeMember(member.id)" class="text-red-600 hover:text-red-700 text-sm">
                    Xóa
                  </button>
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

      <!-- Invite Modal -->
      @if (showInviteModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 class="text-xl font-bold mb-4">Mời thành viên</h2>
            <p class="text-sm text-gray-500 mb-4">Nhập email của người bạn muốn mời vào gia đình</p>
            
            <div class="space-y-3">
              <input 
                [(ngModel)]="inviteEmail" 
                type="email" 
                placeholder="example@email.com"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                (keydown.enter)="inviteMember()"
              />
              
              @if (inviteError()) {
                <p class="text-red-600 text-sm">{{ inviteError() }}</p>
              }
              
              @if (inviteSuccess()) {
                <p class="text-green-600 text-sm">{{ inviteSuccess() }}</p>
              }
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button (click)="closeInviteModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Hủy
              </button>
              <button (click)="inviteMember()" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Mời
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class MembersComponent implements OnInit {
  currentFamily;
  members;
  
  showInviteModal = signal(false);
  inviteEmail = signal('');
  inviteError = signal('');
  inviteSuccess = signal('');

  constructor(
    private familyRepo: FamilyRepository,
    private emailService: EmailService
  ) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.members = this.familyRepo.familyMembers;
  }

  async ngOnInit() {
    const family = this.currentFamily();
    if (family) {
      await this.familyRepo.loadMembers(family.id);
    }
  }

  openInviteModal() {
    this.showInviteModal.set(true);
    this.inviteError.set('');
    this.inviteSuccess.set('');
  }

  closeInviteModal() {
    this.showInviteModal.set(false);
    this.inviteEmail.set('');
    this.inviteError.set('');
    this.inviteSuccess.set('');
  }

  async inviteMember() {
    const email = this.inviteEmail();
    if (!email) {
      this.inviteError.set('Vui lòng nhập email');
      return;
    }
    
    const family = this.currentFamily();
    if (!family) {
      this.inviteError.set('Không tìm thấy gia đình');
      return;
    }

    const result = await this.emailService.sendInvite(family.id, email, 'Current User');
    
    if (result.success) {
      this.inviteSuccess.set(result.message);
      this.inviteEmail.set('');
      // Reload members to show new invitee
      setTimeout(() => {
        this.familyRepo.loadMembers(family.id);
      }, 1000);
    } else {
      this.inviteError.set(result.message);
    }
  }

  async removeMember(memberId: string) {
    const result = confirm('Bạn có chắc chắn muốn xóa thành viên này?');
    if (result) {
      await this.familyRepo.removeMember(memberId);
    }
  }
}