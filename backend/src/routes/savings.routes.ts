import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate';
import { amountValidator, transferValidator } from '../middleware/validators/savings.validator';
import {
  getMyAccountController,
  getMyTransactionsController,
  listAccountsController,
  getAccountController,
  getAccountTransactionsController,
  depositController,
  withdrawController,
  transferController,
} from '../controllers/savings.controller';

const router = Router();

// Member: own account
router.get('/members/me/account',               authenticate, requireRole('member'), getMyAccountController);
router.get('/members/me/account/transactions',  authenticate, requireRole('member'), getMyTransactionsController);

// Admin / staff — transfer must come before :id to avoid param capture
router.post('/admin/accounts/transfer',           authenticate, requireRole('admin', 'staff'), transferValidator,  transferController);
router.get ('/admin/accounts',                    authenticate, requireRole('admin', 'staff'), listAccountsController);
router.get ('/admin/accounts/:id',                authenticate, requireRole('admin', 'staff'), getAccountController);
router.get ('/admin/accounts/:id/transactions',   authenticate, requireRole('admin', 'staff'), getAccountTransactionsController);
router.post('/admin/accounts/:id/deposit',        authenticate, requireRole('admin', 'staff'), amountValidator,    depositController);
router.post('/admin/accounts/:id/withdraw',       authenticate, requireRole('admin', 'staff'), amountValidator,    withdrawController);

export default router;
