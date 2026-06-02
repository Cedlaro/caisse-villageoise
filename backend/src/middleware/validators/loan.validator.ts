import { body } from 'express-validator';

export const applyLoanValidator = [
  body('loan_amount')
    .isFloat({ min: 100 })
    .withMessage('Loan amount must be at least 100.'),
  body('interest_rate')
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('Interest rate must be between 0.01 and 100.'),
  body('term_months')
    .isInt({ min: 1, max: 360 })
    .withMessage('Term must be between 1 and 360 months.'),
];

export const adminCreateLoanValidator = [
  body('member_number')
    .trim()
    .notEmpty()
    .withMessage('Member number is required.'),
  body('loan_amount')
    .isFloat({ min: 100 })
    .withMessage('Loan amount must be at least 100.'),
  body('interest_rate')
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('Interest rate must be between 0.01 and 100.'),
  body('term_months')
    .isInt({ min: 1, max: 360 })
    .withMessage('Term must be between 1 and 360 months.'),
];

export const updateLoanValidator = [
  body('loan_amount')
    .isFloat({ min: 100 })
    .withMessage('Loan amount must be at least 100.'),
  body('interest_rate')
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('Interest rate must be between 0.01 and 100.'),
  body('term_months')
    .isInt({ min: 1, max: 360 })
    .withMessage('Term must be between 1 and 360 months.'),
];

export const updateStatusValidator = [
  body('status')
    .isIn(['applied', 'under_review', 'approved', 'active', 'defaulted', 'paid'])
    .withMessage('Invalid loan status.'),
];

export const repaymentValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Repayment amount must be greater than 0.'),
  body('payment_method')
    .isIn(['account', 'cash'])
    .withMessage('Payment method must be "account" or "cash".'),
];
