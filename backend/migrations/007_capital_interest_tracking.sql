-- =============================================================
-- Migration: 007_capital_interest_tracking.sql
-- Adds capital/interest split tracking to loan repayments and
-- switches remaining_balance to reducing-balance (principal-only)
-- =============================================================

USE caisse_villageoise;

-- Add capital/interest breakdown columns to repayment transactions
ALTER TABLE transactions
  ADD COLUMN capital_amount  DECIMAL(15,2) NULL AFTER amount,
  ADD COLUMN interest_amount DECIMAL(15,2) NULL AFTER capital_amount;

-- Add pre-computed monthly payment to loans
ALTER TABLE loans
  ADD COLUMN monthly_payment DECIMAL(15,2) NULL AFTER remaining_balance;

-- Compute standard amortisation monthly payment for all existing loans
UPDATE loans
SET monthly_payment = CASE
  WHEN interest_rate = 0 OR interest_rate IS NULL
    THEN ROUND(loan_amount / term_months, 2)
  ELSE ROUND(
    loan_amount
    * (interest_rate / 100 / 12)
    * POW(1 + interest_rate / 100 / 12, term_months)
    / (POW(1 + interest_rate / 100 / 12, term_months) - 1),
    2
  )
END;

-- Convert remaining_balance from flat-total (P×(1+r) model) to
-- principal-only (reducing-balance model).
-- Under flat rate each payment proportionally retired capital and interest at
-- ratio P : P×r, so:  remaining_principal = remaining_flat / (1 + rate/100)
UPDATE loans
SET remaining_balance = ROUND(remaining_balance / (1 + interest_rate / 100), 2)
WHERE status IN ('active', 'defaulted')
  AND interest_rate > 0;
