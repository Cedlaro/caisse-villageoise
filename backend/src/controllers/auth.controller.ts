import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { memberLogin, staffLogin } from '../services/auth.service';

interface ApiError {
  status: number;
  message: string;
}

function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null && 'status' in err && 'message' in err;
}

export async function memberLoginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  try {
    const { member_number_or_email, password } = req.body as {
      member_number_or_email: string;
      password: string;
    };

    const result = await memberLogin(member_number_or_email, password);
    res.status(200).json(result);
  } catch (err) {
    if (isApiError(err)) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    next(err);
  }
}

export async function staffLoginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  try {
    const { employee_id_or_email, password } = req.body as {
      employee_id_or_email: string;
      password: string;
    };

    const result = await staffLogin(employee_id_or_email, password);
    res.status(200).json(result);
  } catch (err) {
    if (isApiError(err)) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    next(err);
  }
}
