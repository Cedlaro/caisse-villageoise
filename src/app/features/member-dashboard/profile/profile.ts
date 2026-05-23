import { Component, inject, signal, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MemberService } from '../../../core/services/member.service';
import { MemberDetail } from '../../../core/models/member.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SlicePipe],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private readonly memberService = inject(MemberService);

  readonly member    = signal<MemberDetail | null>(null);
  readonly isLoading = signal(true);
  readonly errorMsg  = signal<string | null>(null);

  ngOnInit(): void {
    this.memberService.getMyProfile().subscribe({
      next: (m) => { this.member.set(m); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Failed to load profile.'); this.isLoading.set(false); },
    });
  }

  statusLabel(status: string): string {
    return { pending_kyc: 'Pending KYC', active: 'Active', suspended: 'Suspended' }[status] ?? status;
  }

  statusClass(status: string): string {
    return {
      pending_kyc: 'bg-yellow-100 text-yellow-800',
      active:      'bg-green-100 text-green-800',
      suspended:   'bg-red-100 text-red-800',
    }[status] ?? 'bg-gray-100 text-gray-700';
  }
}
