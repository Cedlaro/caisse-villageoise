-- =============================================================
-- Migration: 001_init.sql
-- Creates all base tables for Caisse Villageoise
-- =============================================================

CREATE DATABASE IF NOT EXISTS caisse_villageoise
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE caisse_villageoise;

-- -------------------------------------------------------------
-- staff_users
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_users (
  id                    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  employee_id           VARCHAR(50)     NOT NULL,
  email                 VARCHAR(255)    NOT NULL,
  first_name            VARCHAR(100)    NOT NULL,
  last_name             VARCHAR(100)    NOT NULL,
  password_hash         VARCHAR(255)    NOT NULL,
  role                  ENUM('staff', 'admin') NOT NULL DEFAULT 'staff',
  status                ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  lockout_until         DATETIME        NULL,
  last_login_at         DATETIME        NULL,
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_employee_id (employee_id),
  UNIQUE KEY uq_staff_email      (email),
  INDEX idx_staff_status         (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- members
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
  id                    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  member_number         VARCHAR(50)     NOT NULL,
  email                 VARCHAR(255)    NOT NULL,
  first_name            VARCHAR(100)    NOT NULL,
  last_name             VARCHAR(100)    NOT NULL,
  address               TEXT            NULL,
  dob                   DATE            NULL,
  phone                 VARCHAR(30)     NULL,
  password_hash         VARCHAR(255)    NOT NULL,
  status                ENUM('pending_kyc', 'active', 'suspended') NOT NULL DEFAULT 'pending_kyc',
  failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  lockout_until         DATETIME        NULL,
  last_login_at         DATETIME        NULL,
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_member_number (member_number),
  UNIQUE KEY uq_member_email  (email),
  INDEX idx_member_status     (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- savings_accounts
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savings_accounts (
  id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  member_id      INT UNSIGNED    NOT NULL,
  account_number VARCHAR(50)     NOT NULL,
  account_type   ENUM('share_capital', 'regular', 'fixed') NOT NULL DEFAULT 'regular',
  balance        DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_account_number (account_number),
  CONSTRAINT fk_sa_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- transactions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id                    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  account_id            INT UNSIGNED    NOT NULL,
  transaction_type      ENUM('deposit', 'withdrawal', 'transfer', 'loan_repayment') NOT NULL,
  amount                DECIMAL(15,2)   NOT NULL,
  reference_id          VARCHAR(100)    NOT NULL,
  processed_by_staff_id INT UNSIGNED    NULL,
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_reference_id (reference_id),
  CONSTRAINT fk_tx_account FOREIGN KEY (account_id)            REFERENCES savings_accounts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tx_staff   FOREIGN KEY (processed_by_staff_id) REFERENCES staff_users(id)      ON DELETE SET NULL,
  INDEX idx_tx_account (account_id),
  INDEX idx_tx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- loans
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loans (
  id                    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  member_id             INT UNSIGNED    NOT NULL,
  loan_amount           DECIMAL(15,2)   NOT NULL,
  interest_rate         DECIMAL(5,2)    NOT NULL,
  term_months           INT UNSIGNED    NOT NULL,
  status                ENUM('applied', 'under_review', 'approved', 'active', 'defaulted', 'paid') NOT NULL DEFAULT 'applied',
  remaining_balance     DECIMAL(15,2)   NOT NULL,
  reviewed_by_staff_id  INT UNSIGNED    NULL,
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_loan_member FOREIGN KEY (member_id)            REFERENCES members(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_loan_staff  FOREIGN KEY (reviewed_by_staff_id) REFERENCES staff_users(id) ON DELETE SET NULL,
  INDEX idx_loan_member (member_id),
  INDEX idx_loan_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- beneficiaries
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS beneficiaries (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  member_id    INT UNSIGNED    NOT NULL,
  full_name    VARCHAR(200)    NOT NULL,
  relationship VARCHAR(100)    NOT NULL,
  percentage   TINYINT UNSIGNED NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_ben_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  INDEX idx_ben_member (member_id),
  CONSTRAINT chk_percentage CHECK (percentage BETWEEN 1 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
