import { body } from 'express-validator';

export const beneficiaryValidator = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.'),
  body('relationship')
    .trim()
    .notEmpty()
    .withMessage('Relationship is required.'),
  body('percentage')
    .isInt({ min: 1, max: 100 })
    .withMessage('Percentage must be a whole number between 1 and 100.'),
];
