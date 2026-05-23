import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MemberDetail,
  MemberListResponse,
  RegisterPayload,
} from '../models/member.models';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  register(payload: RegisterPayload): Observable<{ memberId: number; memberNumber: string }> {
    return this.http.post<{ memberId: number; memberNumber: string }>(
      `${this.base}/members/register`,
      payload,
    );
  }

  getMyProfile(): Observable<MemberDetail> {
    return this.http.get<MemberDetail>(`${this.base}/members/me`);
  }

  listMembers(opts: { page?: number; limit?: number; search?: string; status?: string }): Observable<MemberListResponse> {
    let params = new HttpParams()
      .set('page',   String(opts.page  ?? 1))
      .set('limit',  String(opts.limit ?? 20))
      .set('search', opts.search ?? '')
      .set('status', opts.status ?? 'all');
    return this.http.get<MemberListResponse>(`${this.base}/admin/members`, { params });
  }

  getMember(id: number): Observable<MemberDetail> {
    return this.http.get<MemberDetail>(`${this.base}/admin/members/${id}`);
  }

  updateStatus(id: number, status: 'active' | 'suspended'): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.base}/admin/members/${id}/status`,
      { status },
    );
  }
}
