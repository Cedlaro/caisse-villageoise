import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import {
  registerMember,
  adminCreateMember,
  updateMember,
  listMembers,
  getMemberById,
  updateMemberStatus,
  getAdminStats,
} from '../services/member.service';

interface ApiError { status: number; message: string; }
function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e;
}

// POST /api/v1/members/register
export async function registerController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }

  try {
    const result = await registerMember({
      firstName: req.body.first_name,
      lastName:  req.body.last_name,
      email:     req.body.email,
      phone:     req.body.phone,
      dob:       req.body.dob,
      address:   req.body.address,
      password:  req.body.password,
    });
    res.status(201).json(result);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// POST /api/v1/admin/members
export async function adminCreateController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }

  try {
    const result = await adminCreateMember({
      firstName: req.body.first_name,
      lastName:  req.body.last_name,
      email:     req.body.email,
      phone:     req.body.phone    ?? '',
      dob:       req.body.dob      ?? '',
      address:   req.body.address  ?? '',
      password:  req.body.password,
      status:    req.body.status   ?? 'active',
    });
    res.status(201).json(result);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// PUT /api/v1/admin/members/:id
export async function updateMemberController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }

  try {
    const id = Number(req.params['id']);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid member ID.' }); return; }

    await updateMember(id, {
      firstName: req.body.first_name,
      lastName:  req.body.last_name,
      email:     req.body.email,
      phone:     req.body.phone    ?? '',
      dob:       req.body.dob      ?? '',
      address:   req.body.address  ?? '',
    });
    res.json({ message: 'Member updated successfully.' });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// GET /api/v1/admin/members
export async function listMembersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page   = Math.max(1, Number(req.query['page']  ?? 1));
    const limit  = Math.min(100, Math.max(1, Number(req.query['limit'] ?? 20)));
    const search = String(req.query['search'] ?? '').trim();
    const status = String(req.query['status'] ?? 'all').trim();

    const result = await listMembers({ page, limit, search, status });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/members/:id
export async function getMemberController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params['id']);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid member ID.' }); return; }
    const member = await getMemberById(id);
    res.json(member);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// PATCH /api/v1/admin/members/:id/status
export async function updateStatusController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }

  try {
    const id     = Number(req.params['id']);
    const status = req.body.status as 'active' | 'suspended';
    await updateMemberStatus(id, status);
    res.json({ message: `Member status updated to ${status}.` });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// GET /api/v1/admin/stats
export async function getStatsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/members/me  (authenticated member)
export async function getMeController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await getMemberById(req.user!.userId);
    res.json(member);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}
