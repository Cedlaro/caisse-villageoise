import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate';
import {
  getMyLoansController,
  applyForLoanController,
  listLoansController,
  getLoanController,
  adminCreateLoanController,
  updateLoanController,
  updateLoanStatusController,
  recordRepaymentController,
} from '../controllers/loan.controller';
import {
  applyLoanValidator,
  adminCreateLoanValidator,
  updateLoanValidator,
  updateStatusValidator,
  repaymentValidator,
} from '../middleware/validators/loan.validator';

const router = Router();

// ── Member routes ─────────────────────────────────────────────────────────────
router.get(
  '/members/me/loans',
  authenticate,
  requireRole('member'),
  getMyLoansController,
);

router.post(
  '/members/me/loans',
  authenticate,
  requireRole('member'),
  applyLoanValidator,
  applyForLoanController,
);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get(
  '/admin/loans',
  authenticate,
  requireRole('staff', 'admin'),
  listLoansController,
);

// POST /admin/loans must come before /:id routes
router.post(
  '/admin/loans',
  authenticate,
  requireRole('staff', 'admin'),
  adminCreateLoanValidator,
  adminCreateLoanController,
);

router.get(
  '/admin/loans/:id',
  authenticate,
  requireRole('staff', 'admin'),
  getLoanController,
);

router.put(
  '/admin/loans/:id',
  authenticate,
  requireRole('staff', 'admin'),
  updateLoanValidator,
  updateLoanController,
);

router.patch(
  '/admin/loans/:id/status',
  authenticate,
  requireRole('staff', 'admin'),
  updateStatusValidator,
  updateLoanStatusController,
);

router.post(
  '/admin/loans/:id/repayment',
  authenticate,
  requireRole('staff', 'admin'),
  repaymentValidator,
  recordRepaymentController,
);

export default router;
