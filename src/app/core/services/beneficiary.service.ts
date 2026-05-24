import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Beneficiary, BeneficiaryPayload } from '../models/beneficiary.models';

@Injectable({ providedIn: 'root' })
export class BeneficiaryService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getMyBeneficiaries(): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(`${this.base}/members/me/beneficiaries`);
  }

  getMemberBeneficiaries(memberId: number): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(`${this.base}/admin/members/${memberId}/beneficiaries`);
  }

  addBeneficiary(memberId: number, payload: BeneficiaryPayload): Observable<{ beneficiaryId: number }> {
    return this.http.post<{ beneficiaryId: number }>(
      `${this.base}/admin/members/${memberId}/beneficiaries`,
      payload,
    );
  }

  updateBeneficiary(id: number, payload: BeneficiaryPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.base}/admin/beneficiaries/${id}`,
      payload,
    );
  }

  deleteBeneficiary(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/admin/beneficiaries/${id}`);
  }
}
