export type MemberStatus = 'pending_kyc' | 'active' | 'suspended';

export interface MemberSummary {
  id:            number;
  member_number: string;
  email:         string;
  first_name:    string;
  last_name:     string;
  phone:         string | null;
  status:        MemberStatus;
  created_at:    string;
}

export interface MemberDetail extends MemberSummary {
  address:       string | null;
  dob:           string | null;
  activity:      string | null;
  last_login_at: string | null;
}

export interface MemberListResponse {
  data:  MemberSummary[];
  total: number;
  page:  number;
  limit: number;
}

export interface RegisterPayload {
  first_name:       string;
  last_name:        string;
  email?:           string;
  phone:            string;
  dob:              string;
  address:          string;
  password:         string;
  confirm_password: string;
}

export interface AdminStats {
  totalMembers:     number;
  pendingKyc:       number;
  activeLoans:      number;
  loanApplications: number;
}

export interface AdminMemberPayload {
  first_name: string;
  last_name:  string;
  email:      string;
  phone?:     string;
  dob?:       string;
  address?:   string;
  activity?:  string;
  status?:    MemberStatus;
}

export interface BulkImportPayload {
  first_name: string;
  last_name:  string;
  email?:     string;
  phone?:     string;
  dob?:       string;
  address?:   string;
  activity?:  string;
  status?:    MemberStatus;
}

export interface BulkImportResult {
  created: number;
  failed:  { row: number; name: string; error: string }[];
}

export interface UpdateMemberPayload {
  first_name: string;
  last_name:  string;
  email?:     string;
  phone?:     string;
  dob?:       string;
  address?:   string;
  activity?:  string;
}
