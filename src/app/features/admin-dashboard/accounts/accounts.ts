import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { SlicePipe, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SavingsService } from '../../../core/services/savings.service';
import { AccountWithMember, Transaction, TransactionType } from '../../../core/models/savings.models';

type ModalMode = 'deposit' | 'withdraw';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, SlicePipe, DecimalPipe],
  templateUrl: './accounts.html',
})
export class Accounts implements OnInit {
  private readonly savingsService = inject(SavingsService);
  private readonly fb             = inject(FormBuilder);

  // Accounts list
  readonly accounts     = signal<AccountWithMember[]>([]);
  readonly total        = signal(0);
  readonly page         = signal(1);
  readonly limit        = signal(20);
  readonly searchQuery  = signal('');
  readonly isLoading    = signal(false);
  readonly errorMsg     = signal<string | null>(null);
  readonly actionMsg    = signal<string | null>(null);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.limit()));

  // Transaction slide-over
  readonly showTxPanel   = signal(false);
  readonly txAccount     = signal<AccountWithMember | null>(null);
  readonly transactions  = signal<Transaction[]>([]);
  readonly txTotal       = signal(0);
  readonly txPage        = signal(1);
  readonly txLimit       = signal(15);
  readonly isTxLoading   = signal(false);
  readonly txTotalPages  = computed(() => Math.ceil(this.txTotal() / this.txLimit()));

  // Deposit / Withdraw / Transfer modal
  readonly showModal    = signal(false);
  readonly modalMode    = signal<ModalMode>('deposit');
  readonly modalAccount = signal<AccountWithMember | null>(null);
  readonly isSaving     = signal(false);
  readonly modalError   = signal<string | null>(null);

  form!: FormGroup;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.savingsService.listAccounts({
      page: this.page(), limit: this.limit(), search: this.searchQuery(),
    }).subscribe({
      next: (res) => {
        this.accounts.set(res.data);
        this.total.set(res.total);
        this.isLoading.set(false);
      },
      error: () => { this.errorMsg.set('Failed to load accounts.'); this.isLoading.set(false); },
    });
  }

  search(value: string): void { this.searchQuery.set(value); this.page.set(1); this.load(); }
  goToPage(p: number): void   { this.page.set(p); this.load(); }

  // ── Transaction panel ───────────────────────────────────────────────────────

  openTxPanel(account: AccountWithMember): void {
    this.txAccount.set(account);
    this.txPage.set(1);
    this.transactions.set([]);
    this.showTxPanel.set(true);
    this.loadTransactions();
  }

  closeTxPanel(): void { this.showTxPanel.set(false); }

  loadTransactions(): void {
    const account = this.txAccount();
    if (!account) return;
    this.isTxLoading.set(true);
    this.savingsService.getAccountTransactions(account.id, { page: this.txPage(), limit: this.txLimit() }).subscribe({
      next: (res) => {
        this.transactions.set(res.data);
        this.txTotal.set(res.total);
        this.isTxLoading.set(false);
      },
      error: () => { this.isTxLoading.set(false); },
    });
  }

  goToTxPage(p: number): void { this.txPage.set(p); this.loadTransactions(); }

  // ── Action modal ────────────────────────────────────────────────────────────

  openModal(account: AccountWithMember, mode: ModalMode): void {
    this.modalAccount.set(account);
    this.modalMode.set(mode);
    this.modalError.set(null);
    this.form = this.buildForm();
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.isSaving.set(false); this.modalError.set(null); }

  saveModal(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.modalError.set(null);

    const account = this.modalAccount()!;
    const amount  = Number(this.form.value.amount);
    const mode    = this.modalMode();

    const obs$ = mode === 'deposit'
      ? this.savingsService.deposit(account.id, amount)
      : this.savingsService.withdraw(account.id, amount);

    obs$.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.closeModal();
        this.actionMsg.set(res.message);
        setTimeout(() => this.actionMsg.set(null), 3000);
        this.load();
        if (this.showTxPanel() && this.txAccount()?.id === account.id) {
          this.loadTransactions();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.modalError.set((err.error as { message?: string })?.message ?? 'Operation failed.');
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  accountTypeLabel(type: string): string {
    return { share_capital: 'Share Capital', regular: 'Regular', fixed: 'Fixed' }[type] ?? type;
  }

  txTypeLabel(type: TransactionType): string {
    return { deposit: 'Deposit', withdrawal: 'Withdrawal', transfer: 'Transfer', loan_repayment: 'Loan Repayment' }[type];
  }

  txTypeClass(type: TransactionType): string {
    return {
      deposit:        'bg-green-100 text-green-800',
      withdrawal:     'bg-red-100 text-red-800',
      transfer:       'bg-blue-100 text-blue-800',
      loan_repayment: 'bg-orange-100 text-orange-800',
    }[type];
  }

  modalTitle(): string {
    return { deposit: 'Deposit Funds', withdraw: 'Withdraw Funds' }[this.modalMode()];
  }

  private buildForm(): FormGroup {
    return this.fb.group({ amount: ['', [Validators.required, Validators.min(0.01)]] });
  }
}
