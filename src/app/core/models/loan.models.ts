export type LoanStatus = 'active' | 'defaulted' | 'paid';

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
  repayment_count:  number;
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

export type PaymentMethod = 'account' | 'cash';

export interface LoanRepayment {
  id:                    number;
  amount:                string;
  payment_method:        PaymentMethod;
  reference_id:          string;
  processed_by_staff_id: number | null;
  processed_by_name:     string | null;
  created_at:            string;
}
