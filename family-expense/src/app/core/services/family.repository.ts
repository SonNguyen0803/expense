import { Injectable, signal } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Family, FamilyMember } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FamilyRepository {
  private currentFamily = signal<Family | null>(null);
  private families = signal<Family[]>([]);
  private members = signal<FamilyMember[]>([]);

  selectedFamily = this.currentFamily.asReadonly();
  allFamilies = this.families.asReadonly();
  familyMembers = this.members.asReadonly();

  constructor(private supabase: SupabaseService) {}

  async loadFamilies() {
    try {
      const { data, error } = await (this.supabase.db as any)
        .from('families')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      this.families.set(data || []);
      
      if (data && data.length > 0 && !this.currentFamily()) {
        this.setCurrentFamily(data[0]);
      }

      return data;
    } catch (error) {
      console.error('Error loading families:', error);
      throw error;
    }
  }

  async createFamily(name: string, ownerDisplayName: string) {
    try {
      const user = await this.supabase.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: family, error: familyError } = await (this.supabase.db as any)
        .from('families')
        .insert({
          name,
          owner_id: user.id,
          currency: 'VND'
        })
        .select()
        .single();

      if (familyError) throw familyError;

      const { error: memberError } = await (this.supabase.db as any)
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          display_name: ownerDisplayName,
          role: 'OWNER'
        });

      if (memberError) throw memberError;

      await this.loadFamilies();
      return family;
    } catch (error) {
      console.error('Error creating family:', error);
      throw error;
    }
  }

  async updateFamily(id: string, name: string) {
    try {
      const { data, error } = await (this.supabase.db as any)
        .from('families')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await this.loadFamilies();
      return data;
    } catch (error) {
      console.error('Error updating family:', error);
      throw error;
    }
  }

  async deleteFamily(id: string) {
    try {
      const { error } = await (this.supabase.db as any)
        .from('families')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await this.loadFamilies();
    } catch (error) {
      console.error('Error deleting family:', error);
      throw error;
    }
  }

  setCurrentFamily(family: Family) {
    this.currentFamily.set(family);
    this.loadMembers(family.id);
  }

  async loadMembers(familyId: string) {
    try {
      const { data, error } = await (this.supabase.db as any)
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      this.members.set(data || []);
      return data;
    } catch (error) {
      console.error('Error loading members:', error);
      throw error;
    }
  }

  async addMember(familyId: string, userId: string, displayName: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') {
    try {
      const { data, error } = await (this.supabase.db as any)
        .from('family_members')
        .insert({
          family_id: familyId,
          user_id: userId,
          display_name: displayName,
          role
        })
        .select()
        .single();

      if (error) throw error;
      
      await this.loadMembers(familyId);
      return data;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  async updateMemberRole(memberId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') {
    try {
      const { data, error } = await (this.supabase.db as any)
        .from('family_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      
      if (this.currentFamily()) {
        await this.loadMembers(this.currentFamily()!.id);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  async removeMember(memberId: string) {
    try {
      const { error } = await (this.supabase.db as any)
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      if (this.currentFamily()) {
        await this.loadMembers(this.currentFamily()!.id);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  async getCurrentMember(): Promise<FamilyMember | null> {
    try {
      const family = this.currentFamily();
      const user = await this.supabase.getUser();
      
      if (!family || !user) return null;

      const { data, error } = await (this.supabase.db as any)
        .from('family_members')
        .select('*')
        .eq('family_id', family.id)
        .eq('user_id', user.id)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting current member:', error);
      return null;
    }
  }
}