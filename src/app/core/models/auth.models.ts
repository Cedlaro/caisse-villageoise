export type UserRole = 'member' | 'staff' | 'admin';

export interface AuthUser {
  id: number;
  role: UserRole;
  firstName: string;
  lastName: string;
  identifier: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface MemberLoginPayload {
  member_number_or_email: string;
  password: string;
}

export interface StaffLoginPayload {
  employee_id_or_email: string;
  password: string;
}
