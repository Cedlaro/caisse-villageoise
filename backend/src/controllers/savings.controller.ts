import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import {
  getAccountByMemberId,
  getAccountById,
  listAccounts,
  getTransactions,
  deposit,
  withdraw,
  transfer,
} from '../services/savings.service';

interface ApiError { status: number; message: string; }
function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e;
}

// GET /api/v1/members/me/account
export async function getMyAccountController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await getAccountByMemberId(req.user!.userId);
    res.json(account);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// GET /api/v1/members/me/account/transactions
export async function getMyTransactionsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page  = Math.max(1, Number(req.query['page']  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query['limit'] ?? 20)));
    const account = await getAccountByMemberId(req.user!.userId);
    const result  = await getTransactions(account.id, { page, limit });
    res.json(result);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// GET /api/v1/admin/accounts
export async function listAccountsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page   = Math.max(1, Number(req.query['page']  ?? 1));
    const limit  = Math.min(100, Math.max(1, Number(req.query['limit'] ?? 20)));
    const search = String(req.query['search'] ?? '').trim();
    const result = await listAccounts({ page, limit, search });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/accounts/:id
export async function getAccountController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params['id']);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid account ID.' }); return; }
    const account = await getAccountById(id);
    res.json(account);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// GET /api/v1/admin/accounts/:id/transactions
export async function getAccountTransactionsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id    = Number(req.params['id']);
    const page  = Math.max(1, Number(req.query['page']  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query['limit'] ?? 20)));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid account ID.' }); return; }
    await getAccountById(id);
    const result = await getTransactions(id, { page, limit });
    res.json(result);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// POST /api/v1/admin/accounts/:id/deposit
export async function depositController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const id     = Number(req.params['id']);
    const amount = Number(req.body.amount);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid account ID.' }); return; }
    await deposit(id, amount, req.user!.userId);
    res.json({ message: 'Deposit processed successfully.' });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// POST /api/v1/admin/accounts/:id/withdraw
export async function withdrawController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const id     = Number(req.params['id']);
    const amount = Number(req.body.amount);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid account ID.' }); return; }
    await withdraw(id, amount, req.user!.userId);
    res.json({ message: 'Withdrawal processed successfully.' });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// POST /api/v1/admin/accounts/transfer
export async function transferController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const fromId = Number(req.body.from_account_id);
    const toId   = Number(req.body.to_account_id);
    const amount = Number(req.body.amount);
    await transfer(fromId, toId, amount, req.user!.userId);
    res.json({ message: 'Transfer processed successfully.' });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}
