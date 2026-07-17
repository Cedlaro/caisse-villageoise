import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Loan, LoanWithMember, LoanListResponse, ApplyLoanPayload, LoanStatus, LoanRepayment, PaymentMethod } from '../models/loan.models';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getMyLoans(): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.base}/members/me/loans`);
  }

  applyForLoan(payload: ApplyLoanPayload): Observable<{ message: string; loanId: number }> {
    return this.http.post<{ message: string; loanId: number }>(`${this.base}/members/me/loans`, payload);
  }

  listLoans(opts: { page: number; limit: number; status: string; search: string }): Observable<LoanListResponse> {
    const params = new HttpParams()
      .set('page',   opts.page)
      .set('limit',  opts.limit)
      .set('status', opts.status)
      .set('search', opts.search);
    return this.http.get<LoanListResponse>(`${this.base}/admin/loans`, { params });
  }

  getLoan(id: number): Observable<LoanWithMember> {
    return this.http.get<LoanWithMember>(`${this.base}/admin/loans/${id}`);
  }

  adminCreateLoan(payload: { member_number: string; loan_amount: number; interest_rate: number; term_months: number }): Observable<{ message: string; loanId: number }> {
    return this.http.post<{ message: string; loanId: number }>(`${this.base}/admin/loans`, payload);
  }

  updateLoan(id: number, payload: { loan_amount: number; interest_rate: number; term_months: number }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/admin/loans/${id}`, payload);
  }

  updateStatus(id: number, status: LoanStatus): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/admin/loans/${id}/status`, { status });
  }

  getLoanRepayments(id: number): Observable<LoanRepayment[]> {
    return this.http.get<LoanRepayment[]>(`${this.base}/admin/loans/${id}/repayments`);
  }

  recordRepayment(id: number, capitalAmount: number, interestAmount: number, paymentMethod: PaymentMethod, transactionDate: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/admin/loans/${id}/repayment`, {
      capital_amount:   capitalAmount,
      interest_amount:  interestAmount,
      payment_method:   paymentMethod,
      transaction_date: transactionDate,
    });
  }
}
