import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { publicOnlyGuard } from './core/auth/public-only.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/signin' },
  { path: 'auth/signin', canActivate: [publicOnlyGuard], loadComponent: () => import('./features/auth/signin.page').then(m => m.SignInPage) },
  { path: 'auth/signup', canActivate: [publicOnlyGuard], loadComponent: () => import('./features/auth/signup.page').then(m => m.SignUpPage) },
  { path: 'auth/forgot-password', canActivate: [publicOnlyGuard], loadComponent: () => import('./features/auth/forgot-password.page').then(m => m.ForgotPasswordPage) },
  { path: 'auth/reset-password', loadComponent: () => import('./features/auth/reset-password.page').then(m => m.ResetPasswordPage) },
  { path: 'login', pathMatch: 'full', redirectTo: 'auth/signin' },
  { path: 'verify', loadComponent: () => import('./features/auth/verify.page') },
  { path: 'verify-email', pathMatch: 'full', redirectTo: 'verify' },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: 'accounts', canActivate: [authGuard], loadComponent: () => import('./features/accounts/accounts.page').then(m => m.AccountsPage) },
  { path: 'transactions', canActivate: [authGuard], loadComponent: () => import('./features/transactions/transactions.page').then(m => m.TransactionsPage) },
  { path: 'budgets', canActivate: [authGuard], loadComponent: () => import('./features/budgets/budgets.page').then(m => m.BudgetsPage) },
  { path: 'welcome', loadComponent: () => import('./features/home/home.page').then(m => m.HomePage) },
  { path: '**', redirectTo: 'dashboard' },
];
