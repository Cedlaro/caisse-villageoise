export type AccountType     = 'share_capital' | 'regular' | 'fixed';
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'loan_repayment';

export interface SavingsAccount {
  id:             number;
  member_id:      number;
  account_number: string;
  account_type:   AccountType;
  balance:        string;
  created_at:     string;
}

export interface AccountWithMember extends SavingsAccount {
  first_name:    string;
  last_name:     string;
  email:         string | null;
  member_number: string;
}

export interface Transaction {
  id:                    number;
  account_id:            number;
  transaction_type:      TransactionType;
  amount:                string;
  reference_id:          string;
  processed_by_staff_id: number | null;
  processed_by_name:     string | null;
  created_at:            string;
}

export interface TransactionListResponse {
  data:  Transaction[];
  total: number;
  page:  number;
  limit: number;
}

export interface AccountListResponse {
  data:  AccountWithMember[];
  total: number;
  page:  number;
  limit: number;
}
