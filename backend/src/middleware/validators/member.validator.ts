import { body, ValidationChain } from 'express-validator';

export const registerValidator: ValidationChain[] = [
  body('first_name').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('last_name').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('email').trim().notEmpty().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ max: 30 }),
  body('dob').notEmpty().withMessage('Date of birth is required').isISO8601().withMessage('Date must be in YYYY-MM-DD format'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
];

export const updateStatusValidator: ValidationChain[] = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['active', 'suspended']).withMessage('Status must be active or suspended'),
];
