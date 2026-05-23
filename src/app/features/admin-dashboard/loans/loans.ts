import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LoanService } from '../../../core/services/loan.service';
import { LoanWithMember, LoanStatus } from '../../../core/models/loan.models';

type RepayModal = { loan: LoanWithMember };

@Component({
  selector: 'app-admin-loans',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './loans.html',
})
export class AdminLoans implements OnInit {
  private readonly loanService = inject(LoanService);
  private readonly fb          = inject(FormBuilder);

  // List
  readonly loans       = signal<LoanWithMember[]>([]);
  readonly total       = signal(0);
  readonly page        = signal(1);
  readonly limit       = signal(20);
  readonly statusFilter = signal('all');
  readonly searchQuery = signal('');
  readonly isLoading   = signal(false);
  readonly errorMsg    = signal<string | null>(null);
  readonly actionMsg   = signal<string | null>(null);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.limit()));

  readonly statusOptions: { value: string; label: string }[] = [
    { value: 'all',          label: 'All' },
    { value: 'applied',      label: 'Applied' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved',     label: 'Approved' },
    { value: 'active',       label: 'Active' },
    { value: 'defaulted',    label: 'Defaulted' },
    { value: 'paid',         label: 'Paid' },
  ];

  // Status transition modal
  readonly showStatusModal  = signal(false);
  readonly statusLoan       = signal<LoanWithMember | null>(null);
  readonly pendingStatus    = signal<LoanStatus | null>(null);
  readonly isSavingStatus   = signal(false);
  readonly statusError      = signal<string | null>(null);

  // Repayment modal
  readonly showRepayModal = signal(false);
  readonly repayLoan      = signal<LoanWithMember | null>(null);
  readonly isSavingRepay  = signal(false);
  readonly repayError     = signal<string | null>(null);
  repayForm!: FormGroup;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.loanService.listLoans({
      page: this.page(), limit: this.limit(),
      status: this.statusFilter(), search: this.searchQuery(),
    }).subscribe({
      next: (res) => { this.loans.set(res.data); this.total.set(res.total); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Failed to load loans.'); this.isLoading.set(false); },
    });
  }

  search(value: string): void { this.searchQuery.set(value); this.page.set(1); this.load(); }
  filterStatus(value: string): void { this.statusFilter.set(value); this.page.set(1); this.load(); }
  goToPage(p: number): void { this.page.set(p); this.load(); }

  // ── Status transition ───────────────────────────────────────────────────────

  nextStatuses(loan: LoanWithMember): LoanStatus[] {
    const map: Record<LoanStatus, LoanStatus[]> = {
      applied:      ['under_review'],
      under_review: ['approved', 'applied'],
      approved:     ['active'],
      active:       ['defaulted'],
      defaulted:    [],
      paid:         [],
    };
    return map[loan.status] ?? [];
  }

  openStatusModal(loan: LoanWithMember, status: LoanStatus): void {
    this.statusLoan.set(loan);
    this.pendingStatus.set(status);
    this.statusError.set(null);
    this.showStatusModal.set(true);
  }

  closeStatusModal(): void { this.showStatusModal.set(false); this.isSavingStatus.set(false); this.statusError.set(null); }

  confirmStatus(): void {
    const loan   = this.statusLoan();
    const status = this.pendingStatus();
    if (!loan || !status) return;
    this.isSavingStatus.set(true);
    this.loanService.updateStatus(loan.id, status).subscribe({
      next: (res) => {
        this.isSavingStatus.set(false);
        this.closeStatusModal();
        this.actionMsg.set(res.message);
        setTimeout(() => this.actionMsg.set(null), 3000);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.isSavingStatus.set(false);
        this.statusError.set((err.error as { message?: string })?.message ?? 'Failed to update status.');
      },
    });
  }

  // ── Repayment ───────────────────────────────────────────────────────────────

  openRepayModal(loan: LoanWithMember): void {
    this.repayLoan.set(loan);
    this.repayError.set(null);
    this.repayForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
    });
    this.showRepayModal.set(true);
  }

  closeRepayModal(): void { this.showRepayModal.set(false); this.isSavingRepay.set(false); this.repayError.set(null); }

  submitRepayment(): void {
    if (this.repayForm.invalid) { this.repayForm.markAllAsTouched(); return; }
    const loan = this.repayLoan();
    if (!loan) return;
    this.isSavingRepay.set(true);
    this.repayError.set(null);
    this.loanService.recordRepayment(loan.id, Number(this.repayForm.value.amount)).subscribe({
      next: (res) => {
        this.isSavingRepay.set(false);
        this.closeRepayModal();
        this.actionMsg.set(res.message);
        setTimeout(() => this.actionMsg.set(null), 3000);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.isSavingRepay.set(false);
        this.repayError.set((err.error as { message?: string })?.message ?? 'Failed to record repayment.');
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  monthlyPayment(loan: LoanWithMember): number {
    const P = Number(loan.loan_amount);
    const r = Number(loan.interest_rate) / 100 / 12;
    const n = loan.term_months;
    if (r === 0) return P / n;
    return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  statusLabel(status: LoanStatus): string {
    return {
      applied:      'Applied',
      under_review: 'Under Review',
      approved:     'Approved',
      active:       'Active',
      defaulted:    'Defaulted',
      paid:         'Paid',
    }[status];
  }

  statusClass(status: LoanStatus): string {
    return {
      applied:      'bg-gray-100 text-gray-700',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved:     'bg-blue-100 text-blue-800',
      active:       'bg-green-100 text-green-800',
      defaulted:    'bg-red-100 text-red-800',
      paid:         'bg-emerald-100 text-emerald-800',
    }[status];
  }

  nextStatusLabel(status: LoanStatus): string {
    return {
      applied:      'Send for Review',
      under_review: 'Approve',
      approved:     'Activate',
      active:       'Mark Defaulted',
      defaulted:    '',
      paid:         '',
    }[status] ?? status;
  }

  nextStatusLabelAlt(status: LoanStatus): string {
    return status === 'under_review' ? 'Return to Applied' : '';
  }
}
