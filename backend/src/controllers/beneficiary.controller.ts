import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import {
  getBeneficiariesByMember,
  addBeneficiary,
  editBeneficiary,
  removeBeneficiary,
} from '../services/beneficiary.service';

interface ApiError { status: number; message: string; }
function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e;
}

// GET /api/v1/members/me/beneficiaries  — member read-only
export async function getMyBeneficiariesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await getBeneficiariesByMember(req.user!.userId);
    res.json(list);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// GET /api/v1/admin/members/:memberId/beneficiaries
export async function adminGetBeneficiariesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const memberId = Number(req.params['memberId']);
    if (isNaN(memberId)) { res.status(400).json({ message: 'Invalid member ID.' }); return; }
    const list = await getBeneficiariesByMember(memberId);
    res.json(list);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// POST /api/v1/admin/members/:memberId/beneficiaries
export async function adminAddBeneficiaryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }

  try {
    const memberId = Number(req.params['memberId']);
    if (isNaN(memberId)) { res.status(400).json({ message: 'Invalid member ID.' }); return; }
    const result = await addBeneficiary({
      memberId,
      fullName:     req.body.full_name,
      relationship: req.body.relationship,
      percentage:   Number(req.body.percentage),
    });
    res.status(201).json(result);
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// PUT /api/v1/admin/beneficiaries/:id
export async function adminUpdateBeneficiaryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }

  try {
    const id = Number(req.params['id']);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid beneficiary ID.' }); return; }
    await editBeneficiary(id, {
      fullName:     req.body.full_name,
      relationship: req.body.relationship,
      percentage:   Number(req.body.percentage),
    });
    res.json({ message: 'Beneficiary updated successfully.' });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}

// DELETE /api/v1/admin/beneficiaries/:id
export async function adminDeleteBeneficiaryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params['id']);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid beneficiary ID.' }); return; }
    await removeBeneficiary(id);
    res.json({ message: 'Beneficiary removed successfully.' });
  } catch (err) {
    if (isApiError(err)) { res.status(err.status).json({ message: err.message }); return; }
    next(err);
  }
}
