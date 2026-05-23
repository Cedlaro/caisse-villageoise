import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-1">
        Welcome back, {{ authService.currentUser()?.firstName }}
      </h1>
      <p class="text-gray-500 text-sm mb-8">Credit union operational overview.</p>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Members</p>
          <p class="text-3xl font-bold text-gray-900">—</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pending KYC</p>
          <p class="text-3xl font-bold text-gray-900">—</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active Loans</p>
          <p class="text-3xl font-bold text-gray-900">—</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Applications</p>
          <p class="text-3xl font-bold text-gray-900">—</p>
        </div>
      </div>
    </div>
  `,
})
export class AdminOverview {
  protected readonly authService = inject(AuthService);
}
