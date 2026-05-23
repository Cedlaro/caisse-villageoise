import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { MemberService } from '../../../core/services/member.service';

@Component({
  selector: 'app-member-overview',
  standalone: true,
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-1">
        Welcome back, {{ authService.currentUser()?.firstName }}
      </h1>
      <p class="text-gray-500 text-sm mb-8">Here's a summary of your account.</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Savings Balance</p>
          <p class="text-3xl font-bold text-gray-900">XAF 0.00</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active Loans</p>
          <p class="text-3xl font-bold text-gray-900">0</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Beneficiaries</p>
          <p class="text-3xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </div>
  `,
})
export class MemberOverview {
  protected readonly authService = inject(AuthService);
}
