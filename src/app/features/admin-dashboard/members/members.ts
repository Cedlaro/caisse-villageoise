import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MemberService } from '../../../core/services/member.service';
import { MemberSummary, MemberStatus } from '../../../core/models/member.models';

const STATUS_FILTERS = ['all', 'pending_kyc', 'active', 'suspended'] as const;
type Filter = typeof STATUS_FILTERS[number];

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  templateUrl: './members.html',
})
export class Members implements OnInit {
  private readonly memberService = inject(MemberService);

  readonly members      = signal<MemberSummary[]>([]);
  readonly total        = signal(0);
  readonly page         = signal(1);
  readonly limit        = signal(20);
  readonly searchQuery  = signal('');
  readonly statusFilter = signal<Filter>('all');
  readonly isLoading    = signal(false);
  readonly errorMsg     = signal<string | null>(null);
  readonly actionMsg    = signal<string | null>(null);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.limit()));
  readonly filters = STATUS_FILTERS;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.memberService.listMembers({
      page:   this.page(),
      limit:  this.limit(),
      search: this.searchQuery(),
      status: this.statusFilter(),
    }).subscribe({
      next: (res) => {
        this.members.set(res.data);
        this.total.set(res.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load members.');
        this.isLoading.set(false);
      },
    });
  }

  search(value: string): void {
    this.searchQuery.set(value);
    this.page.set(1);
    this.load();
  }

  setFilter(f: Filter): void {
    this.statusFilter.set(f);
    this.page.set(1);
    this.load();
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  updateStatus(member: MemberSummary, status: 'active' | 'suspended'): void {
    this.memberService.updateStatus(member.id, status).subscribe({
      next: (res) => {
        this.actionMsg.set(res.message);
        setTimeout(() => this.actionMsg.set(null), 3000);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg.set((err.error as { message?: string })?.message ?? 'Action failed.');
      },
    });
  }

  statusLabel(status: MemberStatus): string {
    return { pending_kyc: 'Pending KYC', active: 'Active', suspended: 'Suspended' }[status];
  }

  statusClass(status: MemberStatus): string {
    return {
      pending_kyc: 'bg-yellow-100 text-yellow-800',
      active:      'bg-green-100 text-green-800',
      suspended:   'bg-red-100 text-red-800',
    }[status];
  }
}
