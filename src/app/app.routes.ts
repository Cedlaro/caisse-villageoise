import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login),
  },
  {
    path: 'dashboard/member',
    loadComponent: () =>
      import('./features/member-dashboard/member-dashboard').then(m => m.MemberDashboard),
    canActivate: [authGuard, roleGuard(['member'])],
  },
  {
    path: 'dashboard/admin',
    loadComponent: () =>
      import('./features/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
    canActivate: [authGuard, roleGuard(['staff', 'admin'])],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
