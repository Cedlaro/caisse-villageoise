import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { SlicePipe, DecimalPipe } from '@angular/common';
import { SavingsService } from '../../../core/services/savings.service';
import { SavingsAccount, Transaction, TransactionType } from '../../../core/models/savings.models';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [SlicePipe, DecimalPipe],
  templateUrl: './account.html',
})
export class Account implements OnInit {
  private readonly savingsService = inject(SavingsService);

  readonly account     = signal<SavingsAccount | null>(null);
  readonly transactions = signal<Transaction[]>([]);
  readonly total        = signal(0);
  readonly page         = signal(1);
  readonly limit        = signal(10);
  readonly isLoading    = signal(true);
  readonly isTxLoading  = signal(false);
  readonly errorMsg     = signal<string | null>(null);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.limit()));

  ngOnInit(): void {
    this.savingsService.getMyAccount().subscribe({
      next: (a) => {
        this.account.set(a);
        this.isLoading.set(false);
        this.loadTransactions();
      },
      error: () => {
        this.errorMsg.set('Failed to load account.');
        this.isLoading.set(false);
      },
    });
  }

  loadTransactions(): void {
    this.isTxLoading.set(true);
    this.savingsService.getMyTransactions({ page: this.page(), limit: this.limit() }).subscribe({
      next: (res) => {
        this.transactions.set(res.data);
        this.total.set(res.total);
        this.isTxLoading.set(false);
      },
      error: () => { this.isTxLoading.set(false); },
    });
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadTransactions();
  }

  accountTypeLabel(type: string): string {
    return { share_capital: 'Share Capital', regular: 'Regular', fixed: 'Fixed' }[type] ?? type;
  }

  txTypeLabel(type: TransactionType): string {
    return {
      deposit:        'Deposit',
      withdrawal:     'Withdrawal',
      transfer:       'Transfer',
      loan_repayment: 'Loan Repayment',
    }[type];
  }

  txTypeClass(type: TransactionType): string {
    return {
      deposit:        'bg-green-100 text-green-800',
      withdrawal:     'bg-red-100 text-red-800',
      transfer:       'bg-blue-100 text-blue-800',
      loan_repayment: 'bg-orange-100 text-orange-800',
    }[type];
  }

  txAmountClass(type: TransactionType): string {
    return type === 'deposit' || (type === 'transfer' && true)
      ? 'text-gray-900'
      : 'text-gray-900';
  }
}
