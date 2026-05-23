import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as loanService from '../services/loan.service';
import { LoanStatus } from '../services/loan.service';

interface ApiError { status: number; message: string; }
function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e;
}

export async function getMyLoansController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const loans = await loanService.getLoansByMemberId(req.user!.userId);
    res.json(loans);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

export async function applyForLoanController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  try {
    const { loan_amount, interest_rate, term_months } = req.body as {
      loan_amount: number; interest_rate: number; term_months: number;
    };
    const result = await loanService.applyForLoan({
      memberId:     req.user!.userId,
      loanAmount:   loan_amount,
      interestRate: interest_rate,
      termMonths:   term_months,
    });
    res.status(201).json({ message: 'Loan application submitted.', ...result });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

export async function listLoansController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page   = Math.max(1, parseInt(req.query['page']   as string) || 1);
    const limit  = Math.min(100, parseInt(req.query['limit']  as string) || 20);
    const status = (req.query['status'] as string) || 'all';
    const search = (req.query['search'] as string) || '';
    const result = await loanService.listLoans({ page, limit, status, search });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getLoanController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid loan ID.' }); return; }
    const loan = await loanService.getLoanById(id);
    res.json(loan);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

export async function updateLoanStatusController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  try {
    const id      = parseInt(req.params['id']);
    const staffId = req.user!.userId;
    const { status } = req.body as { status: LoanStatus };
    await loanService.updateLoanStatus(id, status, staffId);
    res.json({ message: `Loan status updated to '${status}'.` });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

export async function recordRepaymentController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  try {
    const loanId  = parseInt(req.params['id']);
    const staffId = req.user!.userId;
    const { amount } = req.body as { amount: number };
    await loanService.recordRepayment(loanId, amount, staffId);
    res.json({ message: 'Repayment recorded successfully.' });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}
