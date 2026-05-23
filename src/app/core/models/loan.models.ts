export type LoanStatus = 'applied' | 'under_review' | 'approved' | 'active' | 'defaulted' | 'paid';

export interface Loan {
  id:                   number;
  member_id:            number;
  loan_amount:          string;
  interest_rate:        string;
  term_months:          number;
  status:               LoanStatus;
  remaining_balance:    string;
  reviewed_by_staff_id: number | null;
  created_at:           string;
}

export interface LoanWithMember extends Loan {
  first_name:       string;
  last_name:        string;
  member_number:    string;
  reviewed_by_name: string | null;
}

export interface LoanListResponse {
  data:  LoanWithMember[];
  total: number;
  page:  number;
  limit: number;
}

export interface ApplyLoanPayload {
  loan_amount:   number;
  interest_rate: number;
  term_months:   number;
}
