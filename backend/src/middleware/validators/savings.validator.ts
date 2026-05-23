import { body, ValidationChain } from 'express-validator';

export const amountValidator: ValidationChain[] = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
];

export const transferValidator: ValidationChain[] = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('from_account_id')
    .notEmpty().withMessage('Source account is required')
    .isInt({ min: 1 }).withMessage('Invalid source account ID'),
  body('to_account_id')
    .notEmpty().withMessage('Destination account is required')
    .isInt({ min: 1 }).withMessage('Invalid destination account ID'),
];
