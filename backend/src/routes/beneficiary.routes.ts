import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate';
import { beneficiaryValidator } from '../middleware/validators/beneficiary.validator';
import {
  getMyBeneficiariesController,
  adminGetBeneficiariesController,
  adminAddBeneficiaryController,
  adminUpdateBeneficiaryController,
  adminDeleteBeneficiaryController,
} from '../controllers/beneficiary.controller';

const router = Router();

// Member: read-only view of own beneficiaries
router.get(
  '/members/me/beneficiaries',
  authenticate,
  requireRole('member'),
  getMyBeneficiariesController,
);

// Admin/staff: full CRUD
router.get(
  '/admin/members/:memberId/beneficiaries',
  authenticate,
  requireRole('admin', 'staff'),
  adminGetBeneficiariesController,
);

router.post(
  '/admin/members/:memberId/beneficiaries',
  authenticate,
  requireRole('admin', 'staff'),
  beneficiaryValidator,
  adminAddBeneficiaryController,
);

router.put(
  '/admin/beneficiaries/:id',
  authenticate,
  requireRole('admin', 'staff'),
  beneficiaryValidator,
  adminUpdateBeneficiaryController,
);

router.delete(
  '/admin/beneficiaries/:id',
  authenticate,
  requireRole('admin', 'staff'),
  adminDeleteBeneficiaryController,
);

export default router;
