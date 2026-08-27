import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Database } from '../models/database.types';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient<Database>(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  get client(): SupabaseClient<Database> {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  get db() {
    return this.supabase;
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}