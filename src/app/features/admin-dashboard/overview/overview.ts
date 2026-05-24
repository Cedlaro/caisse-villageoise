import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { MemberService } from '../../../core/services/member.service';
import { AdminStats } from '../../../core/models/member.models';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-1">
        Welcome back, {{ authService.currentUser()?.firstName }}
      </h1>
      <p class="text-gray-500 text-sm mb-8">Credit union operational overview.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Members</p>
          <p class="text-3xl font-bold text-gray-900">
            {{ isLoading() ? '…' : (stats()?.totalMembers ?? '—') }}
          </p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pending KYC</p>
          <p class="text-3xl font-bold text-yellow-600">
            {{ isLoading() ? '…' : (stats()?.pendingKyc ?? '—') }}
          </p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active Loans</p>
          <p class="text-3xl font-bold text-green-700">
            {{ isLoading() ? '…' : (stats()?.activeLoans ?? '—') }}
          </p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Applications</p>
          <p class="text-3xl font-bold text-blue-700">
            {{ isLoading() ? '…' : (stats()?.loanApplications ?? '—') }}
          </p>
        </div>

      </div>
    </div>
  `,
})
export class AdminOverview implements OnInit {
  protected readonly authService  = inject(AuthService);
  private  readonly memberService = inject(MemberService);

  readonly stats     = signal<AdminStats | null>(null);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.memberService.getAdminStats().subscribe({
      next:  (s) => { this.stats.set(s); this.isLoading.set(false); },
      error: ()  => { this.isLoading.set(false); },
    });
  }
}
