import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LoanService } from '../../../core/services/loan.service';
import { LoanWithMember, LoanStatus, LoanRepayment, PaymentMethod } from '../../../core/models/loan.models';

type LoanModalMode = 'create' | 'edit';

@Component({
  selector: 'app-admin-loans',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DecimalPipe, SlicePipe],
  templateUrl: './loans.html',
})
export class AdminLoans implements OnInit {
  private readonly loanService = inject(LoanService);
  private readonly fb          = inject(FormBuilder);

  // List
  readonly loans        = signal<LoanWithMember[]>([]);
  readonly total        = signal(0);
  readonly page         = signal(1);
  readonly limit        = signal(20);
  readonly statusFilter = signal('all');
  readonly searchQuery  = signal('');
  readonly isLoading    = signal(false);
  readonly errorMsg     = signal<string | null>(null);
  readonly actionMsg    = signal<string | null>(null);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.limit()));

  readonly statusOptions: { value: string; label: string }[] = [
    { value: 'all',       label: 'All' },
    { value: 'active',    label: 'Active' },
    { value: 'defaulted', label: 'Defaulted' },
    { value: 'paid',      label: 'Paid' },
  ];

  // Add / Edit loan modal
  readonly showLoanModal  = signal(false);
  readonly loanModalMode  = signal<LoanModalMode>('create');
  readonly editingLoan    = signal<LoanWithMember | null>(null);
  readonly isSavingLoan   = signal(false);
  readonly loanModalError = signal<string | null>(null);
  loanForm!: FormGroup;

  // Status transition modal
  readonly showStatusModal = signal(false);
  readonly statusLoan      = signal<LoanWithMember | null>(null);
  readonly pendingStatus   = signal<LoanStatus | null>(null);
  readonly isSavingStatus  = signal(false);
  readonly statusError     = signal<string | null>(null);

  // Repayment modal
  readonly showRepayModal = signal(false);
  readonly repayLoan      = signal<LoanWithMember | null>(null);
  readonly isSavingRepay  = signal(false);
  readonly repayError     = signal<string | null>(null);
  repayForm!: FormGroup;

  // Repayment history modal
  readonly showHistoryModal  = signal(false);
  readonly historyLoan       = signal<LoanWithMember | null>(null);
  readonly repaymentHistory  = signal<LoanRepayment[]>([]);
  readonly isLoadingHistory  = signal(false);
  readonly historyError      = signal<string | null>(null);

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

  // ── Add / Edit loan modal ───────────────────────────────────────────────────

  openCreateLoan(): void {
    this.loanModalMode.set('create');
    this.editingLoan.set(null);
    this.loanModalError.set(null);
    this.loanForm = this.fb.group({
      member_number: ['', [Validators.required]],
      loan_amount:   ['', [Validators.required, Validators.min(100)]],
      interest_rate: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      term_months:   [12, [Validators.required, Validators.min(1), Validators.max(24)]],
    });
    this.showLoanModal.set(true);
  }

  openEditLoan(loan: LoanWithMember): void {
    this.loanModalMode.set('edit');
    this.editingLoan.set(loan);
    this.loanModalError.set(null);
    this.loanForm = this.fb.group({
      loan_amount:   [Number(loan.loan_amount),   [Validators.required, Validators.min(100)]],
      interest_rate: [Number(loan.interest_rate), [Validators.required, Validators.min(1), Validators.max(20)]],
      term_months:   [loan.term_months,            [Validators.required, Validators.min(1), Validators.max(24)]],
    });
    this.showLoanModal.set(true);
  }

  closeLoanModal(): void { this.showLoanModal.set(false); this.isSavingLoan.set(false); this.loanModalError.set(null); }

  saveLoan(): void {
    if (this.loanForm.invalid) { this.loanForm.markAllAsTouched(); return; }
    this.isSavingLoan.set(true);
    this.loanModalError.set(null);

    const mode = this.loanModalMode();
    const obs$ = mode === 'create'
      ? this.loanService.adminCreateLoan(this.loanForm.value)
      : this.loanService.updateLoan(this.editingLoan()!.id, this.loanForm.value);

    obs$.subscribe({
      next: (res) => {
        this.isSavingLoan.set(false);
        this.closeLoanModal();
        this.actionMsg.set(res.message);
        setTimeout(() => this.actionMsg.set(null), 3000);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.isSavingLoan.set(false);
        this.loanModalError.set((err.error as { message?: string })?.message ?? 'Operation failed.');
      },
    });
  }

  canEdit(loan: LoanWithMember): boolean {
    return loan.status === 'active' && loan.repayment_count === 0;
  }

  // ── Status transition ───────────────────────────────────────────────────────

  nextStatuses(loan: LoanWithMember): LoanStatus[] {
    const map: Record<LoanStatus, LoanStatus[]> = {
      active:    ['defaulted'],
      defaulted: [],
      paid:      [],
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
    const today = new Date().toISOString().slice(0, 10);
    this.repayForm = this.fb.group({
      capital_amount:   ['', [Validators.required, Validators.min(0)]],
      interest_amount:  ['', [Validators.required, Validators.min(0)]],
      payment_method:   ['cash', Validators.required],
      transaction_date: [today, Validators.required],
    });
    this.showRepayModal.set(true);
  }

  repayTotal(): number {
    const c = Number(this.repayForm?.get('capital_amount')?.value) || 0;
    const i = Number(this.repayForm?.get('interest_amount')?.value) || 0;
    return +(c + i).toFixed(2);
  }

  closeRepayModal(): void { this.showRepayModal.set(false); this.isSavingRepay.set(false); this.repayError.set(null); }

  submitRepayment(): void {
    if (this.repayForm.invalid) { this.repayForm.markAllAsTouched(); return; }
    const loan = this.repayLoan();
    if (!loan) return;
    this.isSavingRepay.set(true);
    this.repayError.set(null);
    const { capital_amount, interest_amount, payment_method, transaction_date } = this.repayForm.value as {
      capital_amount: number; interest_amount: number; payment_method: PaymentMethod; transaction_date: string;
    };
    this.loanService.recordRepayment(loan.id, Number(capital_amount), Number(interest_amount), payment_method, transaction_date).subscribe({
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

  // ── Repayment history ───────────────────────────────────────────────────────

  openHistoryModal(loan: LoanWithMember): void {
    this.historyLoan.set(loan);
    this.repaymentHistory.set([]);
    this.historyError.set(null);
    this.isLoadingHistory.set(true);
    this.showHistoryModal.set(true);
    this.loanService.getLoanRepayments(loan.id).subscribe({
      next: (data) => { this.repaymentHistory.set(data); this.isLoadingHistory.set(false); },
      error: () => { this.historyError.set('Failed to load repayment history.'); this.isLoadingHistory.set(false); },
    });
  }

  closeHistoryModal(): void { this.showHistoryModal.set(false); }

  paymentMethodLabel(method: PaymentMethod): string {
    return method === 'cash' ? 'Cash' : 'Savings Account';
  }

  paymentMethodClass(method: PaymentMethod): string {
    return method === 'cash'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-blue-100 text-blue-800';
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  monthlyPayment(loan: LoanWithMember): number {
    if (loan.monthly_payment != null) return Number(loan.monthly_payment);
    const P = Number(loan.loan_amount);
    const r = Number(loan.interest_rate) / 100;
    const n = loan.term_months;
    return (P + P * r) / n;
  }

  totalCapitalPaid(): number {
    return this.repaymentHistory().reduce((s, r) => s + (r.capital_amount != null ? +r.capital_amount : 0), 0);
  }

  totalInterestPaid(): number {
    return this.repaymentHistory().reduce((s, r) => s + (r.interest_amount != null ? +r.interest_amount : 0), 0);
  }

  statusLabel(status: LoanStatus): string {
    return {
      active:    'Active',
      defaulted: 'Defaulted',
      paid:      'Paid',
    }[status];
  }

  statusClass(status: LoanStatus): string {
    return {
      active:    'bg-green-100 text-green-800',
      defaulted: 'bg-red-100 text-red-800',
      paid:      'bg-emerald-100 text-emerald-800',
    }[status];
  }
}
