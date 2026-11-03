import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadComponent: () => import('./features/transactions/transaction-list/transaction-list.component').then(m => m.TransactionListComponent)
  },
  {
    path: 'transactions/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/transactions/transaction-form/transaction-form.component').then(m => m.TransactionFormComponent)
  },
  {
    path: 'transactions/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./features/transactions/transaction-form/transaction-form.component').then(m => m.TransactionFormComponent)
  },
  {
    path: 'categories',
    canActivate: [authGuard],
    loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent)
  },
  {
    path: 'budgets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/budgets/budgets.component').then(m => m.BudgetsComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'children',
    canActivate: [authGuard],
    loadComponent: () => import('./features/child-management/child-management.component').then(m => m.ChildManagementComponent)
  },
  {
    path: 'child-management',
    redirectTo: 'children',
    pathMatch: 'full'
  },
  {
    path: 'family',
    canActivate: [authGuard],
    loadComponent: () => import('./features/family/family-settings/family-settings.component').then(m => m.FamilySettingsComponent)
  },
  {
    path: 'family/members',
    canActivate: [authGuard],
    loadComponent: () => import('./features/family/members/members.component').then(m => m.MembersComponent)
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
