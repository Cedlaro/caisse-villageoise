import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate';
import { registerValidator, updateStatusValidator } from '../middleware/validators/member.validator';
import {
  registerController,
  listMembersController,
  getMemberController,
  updateStatusController,
  getMeController,
} from '../controllers/member.controller';

const router = Router();

// Public
router.post('/register', registerValidator, registerController);

// Authenticated member
router.get('/me', authenticate, requireRole('member'), getMeController);

// Admin / staff only
router.get('/admin/members',            authenticate, requireRole('admin', 'staff'), listMembersController);
router.get('/admin/members/:id',        authenticate, requireRole('admin', 'staff'), getMemberController);
router.patch('/admin/members/:id/status', authenticate, requireRole('admin', 'staff'), updateStatusValidator, updateStatusController);

export default router;
