import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as staffService from '../services/staff.service';

interface ApiError { status: number; message: string; }
function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e;
}

export async function listStaffController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page   = Math.max(1, parseInt(req.query['page']   as string) || 1);
    const limit  = Math.min(100, parseInt(req.query['limit']  as string) || 20);
    const search = (req.query['search'] as string) || '';
    const role   = (req.query['role']   as string) || 'all';
    const status = (req.query['status'] as string) || 'all';
    const result = await staffService.listStaff({ page, limit, search, role, status });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStaffController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid staff ID.' }); return; }
    const staff = await staffService.getStaffById(id);
    res.json(staff);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

export async function createStaffController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const result = await staffService.createStaff({
      firstName: req.body.first_name,
      lastName:  req.body.last_name,
      email:     req.body.email,
      role:      req.body.role ?? 'staff',
    });
    res.status(201).json({ message: 'Staff user created successfully.', ...result });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

export async function updateStaffController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const id = parseInt(req.params['id']);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid staff ID.' }); return; }
    await staffService.updateStaff(id, {
      firstName: req.body.first_name,
      lastName:  req.body.last_name,
      email:     req.body.email,
      role:      req.body.role,
    });
    res.json({ message: 'Staff user updated successfully.' });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

export async function getMyStaffController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = await staffService.getStaffById(req.user!.userId);
    res.json(staff);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

export async function updateMyStaffProfileController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    await staffService.updateMyStaffProfile(req.user!.userId, {
      firstName: req.body.first_name,
      lastName:  req.body.last_name,
      email:     req.body.email,
    });
    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

export async function changeMyStaffPasswordController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    await staffService.changeMyStaffPassword(
      req.user!.userId,
      req.body.current_password,
      req.body.new_password,
    );
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

export async function updateStaffStatusController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const id     = parseInt(req.params['id']);
    const status = req.body.status as 'active' | 'suspended';
    await staffService.updateStaffStatus(id, status);
    res.json({ message: `Staff user status updated to ${status}.` });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}
