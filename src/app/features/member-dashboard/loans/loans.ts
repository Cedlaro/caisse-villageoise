import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LoanService } from '../../../core/services/loan.service';
import { Loan, LoanStatus } from '../../../core/models/loan.models';

@Component({
  selector: 'app-member-loans',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './loans.html',
})
export class MemberLoans implements OnInit {
  private readonly loanService = inject(LoanService);
  private readonly fb          = inject(FormBuilder);

  readonly loans      = signal<Loan[]>([]);
  readonly isLoading  = signal(false);
  readonly errorMsg   = signal<string | null>(null);
  readonly actionMsg  = signal<string | null>(null);

  readonly showApply  = signal(false);
  readonly isSaving   = signal(false);
  readonly applyError = signal<string | null>(null);

  form!: FormGroup;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.loanService.getMyLoans().subscribe({
      next:  (loans) => { this.loans.set(loans); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Failed to load loans.'); this.isLoading.set(false); },
    });
  }

  openApply(): void {
    this.applyError.set(null);
    this.form = this.fb.group({
      loan_amount:   ['', [Validators.required, Validators.min(100)]],
      interest_rate: ['', [Validators.required, Validators.min(0.01), Validators.max(100)]],
      term_months:   ['', [Validators.required, Validators.min(1), Validators.max(360)]],
    });
    this.showApply.set(true);
  }

  closeApply(): void { this.showApply.set(false); this.isSaving.set(false); this.applyError.set(null); }

  submitApply(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.applyError.set(null);
    this.loanService.applyForLoan(this.form.value).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.closeApply();
        this.actionMsg.set(res.message);
        setTimeout(() => this.actionMsg.set(null), 4000);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.applyError.set((err.error as { message?: string })?.message ?? 'Failed to submit application.');
      },
    });
  }

  monthlyPayment(loan: Loan): number {
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
}
