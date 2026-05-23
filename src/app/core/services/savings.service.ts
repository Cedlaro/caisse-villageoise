import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SavingsAccount,
  AccountWithMember,
  TransactionListResponse,
  AccountListResponse,
} from '../models/savings.models';

@Injectable({ providedIn: 'root' })
export class SavingsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getMyAccount(): Observable<SavingsAccount> {
    return this.http.get<SavingsAccount>(`${this.base}/members/me/account`);
  }

  getMyTransactions(opts: { page?: number; limit?: number }): Observable<TransactionListResponse> {
    const params = new HttpParams()
      .set('page',  String(opts.page  ?? 1))
      .set('limit', String(opts.limit ?? 20));
    return this.http.get<TransactionListResponse>(
      `${this.base}/members/me/account/transactions`, { params },
    );
  }

  listAccounts(opts: { page?: number; limit?: number; search?: string }): Observable<AccountListResponse> {
    const params = new HttpParams()
      .set('page',   String(opts.page   ?? 1))
      .set('limit',  String(opts.limit  ?? 20))
      .set('search', opts.search ?? '');
    return this.http.get<AccountListResponse>(`${this.base}/admin/accounts`, { params });
  }

  getAccount(id: number): Observable<AccountWithMember> {
    return this.http.get<AccountWithMember>(`${this.base}/admin/accounts/${id}`);
  }

  getAccountTransactions(id: number, opts: { page?: number; limit?: number }): Observable<TransactionListResponse> {
    const params = new HttpParams()
      .set('page',  String(opts.page  ?? 1))
      .set('limit', String(opts.limit ?? 20));
    return this.http.get<TransactionListResponse>(
      `${this.base}/admin/accounts/${id}/transactions`, { params },
    );
  }

  deposit(id: number, amount: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/admin/accounts/${id}/deposit`, { amount });
  }

  withdraw(id: number, amount: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/admin/accounts/${id}/withdraw`, { amount });
  }

  transfer(fromAccountId: number, toAccountId: number, amount: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/admin/accounts/transfer`, {
      from_account_id: fromAccountId,
      to_account_id:   toAccountId,
      amount,
    });
  }
}
