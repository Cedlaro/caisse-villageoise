import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate';
import {
  registerValidator,
  adminCreateValidator,
  adminUpdateValidator,
  updateStatusValidator,
  changePasswordValidator,
} from '../middleware/validators/member.validator';
import {
  registerController,
  adminCreateController,
  updateMemberController,
  listMembersController,
  getMemberController,
  updateStatusController,
  getMeController,
  getStatsController,
  changeMyPasswordController,
  bulkImportController,
} from '../controllers/member.controller';

const router = Router();

// Public
router.post('/register', registerValidator, registerController);

// Authenticated member — self-service
router.get   ('/me',          authenticate, requireRole('member'), getMeController);
router.patch ('/me/password', authenticate, requireRole('member'), changePasswordValidator,   changeMyPasswordController);

// Admin / staff only
router.post  ('/admin/members/bulk-import', authenticate, requireRole('admin', 'staff'), bulkImportController);
router.get   ('/admin/stats',                authenticate, requireRole('admin', 'staff'), getStatsController);
router.post  ('/admin/members',              authenticate, requireRole('admin', 'staff'), adminCreateValidator,  adminCreateController);
router.get   ('/admin/members',              authenticate, requireRole('admin', 'staff'), listMembersController);
router.get   ('/admin/members/:id',          authenticate, requireRole('admin', 'staff'), getMemberController);
router.put   ('/admin/members/:id',          authenticate, requireRole('admin', 'staff'), adminUpdateValidator,  updateMemberController);
router.patch ('/admin/members/:id/status',   authenticate, requireRole('admin', 'staff'), updateStatusValidator, updateStatusController);

export default router;
