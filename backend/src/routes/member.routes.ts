import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate';
import {
  registerValidator,
  adminCreateValidator,
  adminUpdateValidator,
  updateStatusValidator,
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
} from '../controllers/member.controller';

const router = Router();

// Public
router.post('/register', registerValidator, registerController);

// Authenticated member
router.get('/me', authenticate, requireRole('member'), getMeController);

// Admin / staff only
router.get   ('/admin/stats',                authenticate, requireRole('admin', 'staff'), getStatsController);
router.post  ('/admin/members',              authenticate, requireRole('admin', 'staff'), adminCreateValidator,  adminCreateController);
router.get   ('/admin/members',              authenticate, requireRole('admin', 'staff'), listMembersController);
router.get   ('/admin/members/:id',          authenticate, requireRole('admin', 'staff'), getMemberController);
router.put   ('/admin/members/:id',          authenticate, requireRole('admin', 'staff'), adminUpdateValidator,  updateMemberController);
router.patch ('/admin/members/:id/status',   authenticate, requireRole('admin', 'staff'), updateStatusValidator, updateStatusController);

export default router;
