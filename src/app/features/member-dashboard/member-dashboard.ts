import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-member-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">

      <!-- Top nav -->
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
          <button (click)="authService.logout()"
            class="text-sm text-red-600 hover:text-red-700 font-medium">Sign out</button>
        </div>
      </header>

      <div class="flex flex-1">
        <!-- Sidebar -->
        <aside class="w-56 bg-white border-r border-gray-200 p-4 space-y-1">
          <a routerLink="overview" routerLinkActive="bg-blue-50 text-blue-900 font-semibold"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Overview
          </a>
          <a routerLink="profile" routerLinkActive="bg-blue-50 text-blue-900 font-semibold"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            My Profile
          </a>
          <a routerLink="account" routerLinkActive="bg-blue-50 text-blue-900 font-semibold"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            My Account
          </a>
          <a routerLink="loans" routerLinkActive="bg-blue-50 text-blue-900 font-semibold"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            My Loans
          </a>
        </aside>

        <!-- Main content -->
        <main class="flex-1 p-8 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MemberDashboard {
  protected readonly authService = inject(AuthService);
}
