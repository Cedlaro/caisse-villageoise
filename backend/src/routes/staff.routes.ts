import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate';
import {
  listStaffController,
  getStaffController,
  createStaffController,
  updateStaffController,
  updateStaffStatusController,
  getMyStaffController,
  updateMyStaffProfileController,
  changeMyStaffPasswordController,
} from '../controllers/staff.controller';
import {
  createStaffValidator,
  updateStaffValidator,
  updateStaffStatusValidator,
  updateMyStaffProfileValidator,
} from '../middleware/validators/staff.validator';
import { changePasswordValidator } from '../middleware/validators/member.validator';

const router = Router();

// ── Self-service (staff & admin) ──────────────────────────────────────────────
router.get   ('/staff/me',          authenticate, requireRole('staff', 'admin'), getMyStaffController);
router.put   ('/staff/me/profile',  authenticate, requireRole('staff', 'admin'), updateMyStaffProfileValidator,  updateMyStaffProfileController);
router.patch ('/staff/me/password', authenticate, requireRole('staff', 'admin'), changePasswordValidator,        changeMyStaffPasswordController);

// ── Admin-only CRUD ───────────────────────────────────────────────────────────
router.get(
  '/admin/staff',
  authenticate,
  requireRole('admin'),
  listStaffController,
);

router.post(
  '/admin/staff',
  authenticate,
  requireRole('admin'),
  createStaffValidator,
  createStaffController,
);

router.get(
  '/admin/staff/:id',
  authenticate,
  requireRole('admin'),
  getStaffController,
);

router.put(
  '/admin/staff/:id',
  authenticate,
  requireRole('admin'),
  updateStaffValidator,
  updateStaffController,
);

router.patch(
  '/admin/staff/:id/status',
  authenticate,
  requireRole('admin'),
  updateStaffStatusValidator,
  updateStaffStatusController,
);

export default router;
