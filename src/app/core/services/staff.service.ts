import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StaffUser,
  StaffListResponse,
  CreateStaffPayload,
  UpdateStaffPayload,
} from '../models/staff.models';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listStaff(opts: { page?: number; limit?: number; search?: string; role?: string; status?: string }): Observable<StaffListResponse> {
    const params = new HttpParams()
      .set('page',   String(opts.page   ?? 1))
      .set('limit',  String(opts.limit  ?? 20))
      .set('search', opts.search ?? '')
      .set('role',   opts.role   ?? 'all')
      .set('status', opts.status ?? 'all');
    return this.http.get<StaffListResponse>(`${this.base}/admin/staff`, { params });
  }

  getStaff(id: number): Observable<StaffUser> {
    return this.http.get<StaffUser>(`${this.base}/admin/staff/${id}`);
  }

  createStaff(payload: CreateStaffPayload): Observable<{ message: string; staffId: number; employeeId: string }> {
    return this.http.post<{ message: string; staffId: number; employeeId: string }>(
      `${this.base}/admin/staff`,
      payload,
    );
  }

  updateStaff(id: number, payload: UpdateStaffPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/admin/staff/${id}`, payload);
  }

  getMyProfile(): Observable<StaffUser> {
    return this.http.get<StaffUser>(`${this.base}/staff/me`);
  }

  updateMyProfile(payload: { first_name: string; last_name: string; email: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/staff/me/profile`, payload);
  }

  changeMyPassword(payload: { current_password: string; new_password: string; confirm_password: string }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/staff/me/password`, payload);
  }

  updateStatus(id: number, status: 'active' | 'suspended'): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/admin/staff/${id}/status`, { status });
  }
}
