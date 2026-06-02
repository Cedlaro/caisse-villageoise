-- =============================================================
-- Migration: 004_loan_repayment_history.sql
-- Adds loan_id and payment_method columns to transactions
-- to support repayment history and cash payments
-- =============================================================

USE caisse_villageoise;

ALTER TABLE transactions
  ADD COLUMN loan_id INT UNSIGNED NULL
    AFTER account_id,
  ADD COLUMN payment_method ENUM('account', 'cash') NOT NULL DEFAULT 'account'
    AFTER transaction_type,
  ADD CONSTRAINT fk_tx_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL,
  ADD INDEX idx_tx_loan (loan_id);
