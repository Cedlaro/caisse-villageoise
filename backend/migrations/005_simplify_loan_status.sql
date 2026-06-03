-- =============================================================
-- Migration: 005_simplify_loan_status.sql
-- Removes applied/under_review/approved statuses from loans.
-- Existing loans in those states are migrated to 'active'.
-- =============================================================

USE caisse_villageoise;

-- Move any pre-existing loans with removed statuses to active
UPDATE loans SET status = 'active' WHERE status IN ('applied', 'under_review', 'approved');

-- Narrow the ENUM to the three remaining statuses
ALTER TABLE loans
  MODIFY COLUMN status ENUM('active', 'defaulted', 'paid') NOT NULL DEFAULT 'active';
