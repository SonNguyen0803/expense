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
  ) { }

  async sendInvite(familyId: string, email: string, inviterName: string) {
    try {
      // Get inviter profile info
      const {
        data: { user },
        error: authError
      } = await this.supabase.auth.getUser();

      const { data: inviterProfile, error: inviterError } = await (this.supabase.db as any)
        .from('profiles')
        .select('full_name, email')
        .eq('id', user?.id)
        .single();

      if (inviterError) {
        console.error('Error fetching inviter profile:', inviterError);
      }

      // Check if user with this email exists in profiles table
      const { data: existingProfile, error: profileError } = await (this.supabase.db as any)
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email.trim())
        .single();

      // If no error and profile found, user exists
      if (!profileError && existingProfile) {
        const userId = existingProfile.id;
        const displayName = existingProfile.full_name || email.split('@')[0];

        // Check if user is already a member of this family
        const { data: existingMember } = await (this.supabase.db as any)
          .from('family_members')
          .select('id')
          .eq('family_id', familyId)
          .eq('user_id', userId)
          .single();

        if (existingMember) {
          return {
            success: false,
            message: 'Thành viên này đã có trong gia đình'
          };
        }

        // Add user to family
        const { error: insertError } = await (this.supabase.db as any)
          .from('family_members')
          .insert({
            family_id: familyId,
            user_id: userId,
            display_name: displayName,
            role: 'MEMBER'
          });

        if (insertError) throw insertError;

        return {
          success: true,
          message: `Đã thêm ${displayName} vào gia đình`
        };
      }

      // If profile not found (email doesn't exist in system)
      if (profileError && profileError.code === 'PGRST116') {
        return {
          success: false,
          message: 'Email này chưa đăng ký tài khoản trong hệ thống. Vui lòng yêu cầu họ đăng ký trước.'
        };
      }

      // Other errors
      throw profileError || new Error('Có lỗi xảy ra');
    } catch (error: any) {
      console.error('Error sending invite:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi mời thành viên'
      };
    }
  }

  async getProfileByEmail(email: string) {
    try {
      const { data, error } = await (this.supabase.db as any)
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
}