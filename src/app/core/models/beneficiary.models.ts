export interface Beneficiary {
  id:           number;
  member_id:    number;
  full_name:    string;
  relationship: string;
  percentage:   number;
  created_at:   string;
}

export interface BeneficiaryPayload {
  full_name:    string;
  relationship: string;
  percentage:   number;
}
