import { body, ValidationChain } from 'express-validator';

export const memberLoginValidator: ValidationChain[] = [
  body('member_number_or_email')
    .trim()
    .notEmpty().withMessage('Member number or email is required')
    .isLength({ min: 3, max: 255 }).withMessage('Invalid identifier length'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const staffLoginValidator: ValidationChain[] = [
  body('employee_id_or_email')
    .trim()
    .notEmpty().withMessage('Employee ID or email is required')
    .isLength({ min: 3, max: 255 }).withMessage('Invalid identifier length'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];
