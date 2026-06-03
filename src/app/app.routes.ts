import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register),
  },

  {
    path: 'dashboard/member',
    loadComponent: () => import('./features/member-dashboard/member-dashboard').then(m => m.MemberDashboard),
    canActivate: [authGuard, roleGuard(['member'])],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./features/member-dashboard/overview/overview').then(m => m.MemberOverview),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/member-dashboard/profile/profile').then(m => m.Profile),
      },
      {
        path: 'account',
        loadComponent: () => import('./features/member-dashboard/account/account').then(m => m.Account),
      },
      {
        path: 'loans',
        loadComponent: () => import('./features/member-dashboard/loans/loans').then(m => m.MemberLoans),
      },
      {
        path: 'beneficiaries',
        loadComponent: () => import('./features/member-dashboard/beneficiaries/beneficiaries').then(m => m.MemberBeneficiaries),
      },
    ],
  },

  {
    path: 'dashboard/admin',
    loadComponent: () => import('./features/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
    canActivate: [authGuard, roleGuard(['staff', 'admin'])],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./features/admin-dashboard/overview/overview').then(m => m.AdminOverview),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/admin-dashboard/profile/profile').then(m => m.AdminProfile),
      },
      {
        path: 'members',
        loadComponent: () => import('./features/admin-dashboard/members/members').then(m => m.Members),
      },
      {
        path: 'accounts',
        loadComponent: () => import('./features/admin-dashboard/accounts/accounts').then(m => m.Accounts),
      },
      {
        path: 'loans',
        loadComponent: () => import('./features/admin-dashboard/loans/loans').then(m => m.AdminLoans),
      },
      {
        path: 'beneficiaries',
        loadComponent: () => import('./features/admin-dashboard/beneficiaries/beneficiaries').then(m => m.AdminBeneficiaries),
      },
      {
        path: 'staff',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () => import('./features/admin-dashboard/staff/staff').then(m => m.Staff),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
