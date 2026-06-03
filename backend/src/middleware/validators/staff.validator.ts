import { body } from 'express-validator';

export const createStaffValidator = [
  body('first_name').trim().notEmpty().withMessage('First name is required.').isLength({ max: 100 }),
  body('last_name').trim().notEmpty().withMessage('Last name is required.').isLength({ max: 100 }),
  body('email').trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.').normalizeEmail(),
  body('role').optional().isIn(['staff', 'admin']).withMessage('Role must be "staff" or "admin".'),
];

export const updateStaffValidator = [
  body('first_name').trim().notEmpty().withMessage('First name is required.').isLength({ max: 100 }),
  body('last_name').trim().notEmpty().withMessage('Last name is required.').isLength({ max: 100 }),
  body('email').trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.').normalizeEmail(),
  body('role').isIn(['staff', 'admin']).withMessage('Role must be "staff" or "admin".'),
];

export const updateMyStaffProfileValidator = [
  body('first_name').trim().notEmpty().withMessage('First name is required.').isLength({ max: 100 }),
  body('last_name').trim().notEmpty().withMessage('Last name is required.').isLength({ max: 100 }),
  body('email').trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.').normalizeEmail(),
];

export const updateStaffStatusValidator = [
  body('status').isIn(['active', 'suspended']).withMessage('Status must be "active" or "suspended".'),
];
