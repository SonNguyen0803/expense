import {
  Injectable,
  signal,
  computed
} from '@angular/core';

import { Router } from '@angular/router';

import {
  User,
  Subscription
} from '@supabase/supabase-js';

import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // =====================================================
  // STATE
  // =====================================================

  private currentUser =
    signal<User | null>(null);

  private loading =
    signal<boolean>(true);

  private authInitialized =
    signal<boolean>(false);


  // =====================================================
  // PUBLIC SIGNALS
  // =====================================================

  readonly user =
    this.currentUser.asReadonly();

  readonly isAuthenticated =
    computed(() =>
      this.currentUser() !== null
    );

  readonly isLoading =
    this.loading.asReadonly();

  readonly isAuthInitialized =
    this.authInitialized.asReadonly();


  // =====================================================
  // AUTH INITIALIZATION
  // =====================================================

  private authInitializedPromise: Promise<void>;

  private authSubscription?: Subscription;


  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {

    this.authInitializedPromise =
      this.initializeAuth();

  }


  private async initializeAuth(): Promise<void> {

    try {

      // -----------------------------------------------
      // 1. Đăng ký listener trước
      // -----------------------------------------------

      const {
        data: { subscription }
      } = this.supabase.auth.onAuthStateChange(
        (_event, session) => {


          this.currentUser.set(
            session?.user ?? null
          );

        }
      );

      this.authSubscription = subscription;


      // -----------------------------------------------
      // 2. Lấy session hiện tại
      // -----------------------------------------------

      const {
        data,
        error
      } = await this.supabase.auth.getSession();


      if (error) {
        throw error;
      }


      // -----------------------------------------------
      // 3. Set current user
      // -----------------------------------------------

      this.currentUser.set(
        data.session?.user ?? null
      );

    } catch (error) {

      console.error(
        '[AUTH INITIALIZATION ERROR]',
        error
      );

      this.currentUser.set(null);

    } finally {

      // -----------------------------------------------
      // 4. Authentication đã được kiểm tra xong
      // -----------------------------------------------

      this.authInitialized.set(true);

      this.loading.set(false);

    }

  }


  // =====================================================
  // WAIT AUTH INITIALIZATION
  // =====================================================

  async waitForAuthInitialization(): Promise<void> {

    await this.authInitializedPromise;

  }


  // =====================================================
  // SIGN IN
  // =====================================================

  async signIn(
    email: string,
    password: string
  ) {

    const {
      data,
      error
    } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });


    if (error) {
      throw error;
    }


    // Supabase onAuthStateChange()
    // cũng sẽ update currentUser.
    //
    // Nhưng set ở đây giúp state cập nhật
    // ngay lập tức.

    this.currentUser.set(
      data.user
    );


    return data;

  }


  // =====================================================
  // SIGN UP
  // =====================================================

  async signUp(
    email: string,
    password: string,
    fullName: string
  ) {

    const {
      data,
      error
    } = await this.supabase.auth.signUp({

      email,

      password,

      options: {
        data: {
          full_name: fullName
        }
      }

    });


    if (error) {
      throw error;
    }


    // Nếu Supabase không yêu cầu email confirmation
    // thì data.user sẽ tồn tại.

    if (data.user && data.session) {

      this.currentUser.set(
        data.user
      );

    }


    return data;

  }


  // =====================================================
  // SIGN OUT
  // =====================================================

  async signOut() {

    const {
      error
    } = await this.supabase.auth.signOut();


    if (error) {
      throw error;
    }


    // onAuthStateChange cũng sẽ set null,
    // nhưng set trực tiếp để state cập nhật ngay.

    this.currentUser.set(null);


    await this.router.navigate([
      '/login'
    ]);

  }


  // =====================================================
  // RESET PASSWORD
  // =====================================================

  async resetPassword(
    email: string
  ) {

    const {
      error
    } =
      await this.supabase.auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo:
              `${window.location.origin}/reset-password`
          }
        );


    if (error) {
      throw error;
    }

  }


  // =====================================================
  // UPDATE PASSWORD
  // =====================================================

  async updatePassword(
    newPassword: string
  ) {

    const {
      error
    } =
      await this.supabase.auth.updateUser({
        password: newPassword
      });


    if (error) {
      throw error;
    }

  }


  // =====================================================
  // GOOGLE LOGIN
  // =====================================================

  async signInWithGoogle() {

    const {
      error
    } =
      await this.supabase.auth
        .signInWithOAuth({

          provider: 'google',

          options: {

            redirectTo:
              `${window.location.origin}/dashboard`

          }

        });


    if (error) {
      throw error;
    }

  }

}