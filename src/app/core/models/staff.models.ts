export type StaffRole   = 'staff' | 'admin';
export type StaffStatus = 'active' | 'suspended';

export interface StaffUser {
  id:            number;
  employee_id:   string;
  email:         string;
  first_name:    string;
  last_name:     string;
  role:          StaffRole;
  status:        StaffStatus;
  last_login_at: string | null;
  created_at:    string;
}

export interface StaffListResponse {
  data:  StaffUser[];
  total: number;
  page:  number;
  limit: number;
}

export interface CreateStaffPayload {
  first_name: string;
  last_name:  string;
  email:      string;
  role:       StaffRole;
}

export interface UpdateStaffPayload {
  first_name: string;
  last_name:  string;
  email:      string;
  role:       StaffRole;
}
