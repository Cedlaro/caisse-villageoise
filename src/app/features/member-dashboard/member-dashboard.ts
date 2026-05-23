import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-member-dashboard',
  standalone: true,
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <span class="font-bold text-gray-900">Caisse Villageoise</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600">
            {{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}
          </span>
          <button
            (click)="authService.logout()"
            class="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Sign out
          </button>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-6 py-10">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Member Dashboard</h1>
        <p class="text-gray-500">
          Welcome back, {{ authService.currentUser()?.firstName }}.
          Your account is active.
        </p>
        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <p class="text-sm text-gray-500 mb-1">Savings Balance</p>
            <p class="text-3xl font-bold text-gray-900">XAF 0.00</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <p class="text-sm text-gray-500 mb-1">Active Loans</p>
            <p class="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <p class="text-sm text-gray-500 mb-1">Beneficiaries</p>
            <p class="text-3xl font-bold text-gray-900">0</p>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class MemberDashboard {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
}
