import { Injectable, signal } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Category, TransactionType } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CategoryRepository {
  private categories = signal<Category[]>([]);

  allCategories = this.categories.asReadonly();

  constructor(private supabase: SupabaseService) { }

  async loadCategories(familyId?: string) {

    let query = this.supabase.db
      .from('categories')
      .select('*')
      .order('name');

    if (familyId) {

      query = query.or(`family_id.eq.${familyId},is_default.eq.true`);
    } else {

      query = query.eq('is_default', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    this.categories.set(data || []);
    return data;
  }

  async createCategory(
    familyId: string,
    name: string,
    icon: string,
    type: TransactionType,
    color: string
  ) {
    const insertData = {
      family_id: familyId,
      name,
      icon,
      type,
      color,
      is_default: false
    };

    const { data, error } = await this.supabase.db
      .from('categories')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;

    await this.loadCategories(familyId);
    return data;
  }

  async updateCategory(
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
  ) {

  //   const test = this.supabase.db
  // .from('categories');
  //   const { data, error } = await this.supabase.db
  //     .from('categories')
  //     .update(updates as any)
  //     .eq('id', id)
  //     .select()
  //     .single();

  //   if (error) throw error;

  //   const currentCategories = this.categories();
  //   const updatedCategories = currentCategories.map(cat =>
  //     cat.id === id ? { ...cat, ...updates } : cat
  //   );
  //   this.categories.set(updatedCategories);

  //   return data;
  }

  async deleteCategory(id: string) {
    const { error } = await this.supabase.db
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    const currentCategories = this.categories();
    this.categories.set(currentCategories.filter(cat => cat.id !== id));
  }

  getCategoriesByType(type: TransactionType): Category[] {
    return this.categories().filter(cat => cat.type === type);
  }
}