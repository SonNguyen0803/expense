import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { FamilyRepository } from './family.repository';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  constructor(
    private supabase: SupabaseService,
    private familyRepo: FamilyRepository
  ) {}

  async sendInvite(familyId: string, email: string, inviterName: string) {
    try {
      // Check if user exists
      const { data: userData, error: userError } = await (this.supabase.db as any)
        .from('auth.users')
        .select('id, email')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is expected if user doesn't exist
        throw userError;
      }

      const memberId = userData?.id;
      
      const memberData = {
        family_id: familyId,
        user_id: memberId,
        display_name: userData?.email?.split('@')[0] || 'New Member',
        role: 'MEMBER'
      };

      const { error } = await (this.supabase.db as any)
        .from('family_members')
        .insert(memberData);

      if (error) throw error;

      return { success: true, message: 'Mời thành viên thành công!' };
    } catch (error: any) {
      console.error('Error sending invite:', error);
      return { 
        success: false, 
        message: error.message || 'Có lỗi xảy ra khi mời thành viên' 
      };
    }
  }
}