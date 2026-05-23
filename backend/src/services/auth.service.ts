import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  findMemberByEmailOrNumber,
  incrementMemberLoginFailures,
  resetMemberLoginFailures,
  MemberRow,
} from '../repositories/member.repository';
import {
  findStaffByEmailOrEmployeeId,
  incrementStaffLoginFailures,
  resetStaffLoginFailures,
  StaffRow,
} from '../repositories/staff.repository';

const MAX_ATTEMPTS      = Number(process.env.MAX_LOGIN_ATTEMPTS        ?? 5);
const LOCKOUT_MINUTES   = Number(process.env.LOCKOUT_DURATION_MINUTES  ?? 30);
const JWT_SECRET        = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN    = process.env.JWT_EXPIRES_IN ?? '8h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export interface AuthTokenPayload {
  sub: string;
  userId: number;
  role: 'member' | 'staff' | 'admin';
  firstName: string;
  lastName: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: number;
    role: 'member' | 'staff' | 'admin';
    firstName: string;
    lastName: string;
    identifier: string;
  };
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function isLockedOut(lockoutUntil: Date | null): boolean {
  return lockoutUntil !== null && new Date() < new Date(lockoutUntil);
}

function computeLockoutTime(attempts: number): Date | null {
  if (attempts + 1 >= MAX_ATTEMPTS) {
    const until = new Date();
    until.setMinutes(until.getMinutes() + LOCKOUT_MINUTES);
    return until;
  }
  return null;
}

function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

// ── Member login ──────────────────────────────────────────────────────────────

export async function memberLogin(identifier: string, password: string): Promise<LoginResult> {
  const member = await findMemberByEmailOrNumber(identifier);

  if (!member) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  if (member.status === 'suspended') {
    throw { status: 403, message: 'Account suspended. Please contact support.' };
  }

  if (isLockedOut(member.lockout_until)) {
    throw { status: 423, message: 'Account temporarily locked. Please try again later.' };
  }

  const passwordValid = await bcrypt.compare(password, member.password_hash);

  if (!passwordValid) {
    const lockoutUntil = computeLockoutTime(member.failed_login_attempts);
    await incrementMemberLoginFailures(member.id, lockoutUntil);

    if (lockoutUntil) {
      throw { status: 423, message: 'Too many failed attempts. Account locked for 30 minutes.' };
    }
    throw { status: 401, message: 'Invalid credentials' };
  }

  if (member.status === 'pending_kyc') {
    throw { status: 403, message: 'Account pending KYC verification. Please complete your profile.' };
  }

  await resetMemberLoginFailures(member.id);

  const payload: AuthTokenPayload = {
    sub:       member.member_number,
    userId:    member.id,
    role:      'member',
    firstName: member.first_name,
    lastName:  member.last_name,
  };

  return {
    token: signToken(payload),
    user: {
      id:         member.id,
      role:       'member',
      firstName:  member.first_name,
      lastName:   member.last_name,
      identifier: member.member_number,
    },
  };
}

// ── Staff login ───────────────────────────────────────────────────────────────

export async function staffLogin(identifier: string, password: string): Promise<LoginResult> {
  const staff = await findStaffByEmailOrEmployeeId(identifier);

  if (!staff) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  if (staff.status === 'suspended') {
    throw { status: 403, message: 'Account suspended. Please contact your administrator.' };
  }

  if (isLockedOut(staff.lockout_until)) {
    throw { status: 423, message: 'Account temporarily locked. Please try again later.' };
  }

  const passwordValid = await bcrypt.compare(password, staff.password_hash);

  if (!passwordValid) {
    const lockoutUntil = computeLockoutTime(staff.failed_login_attempts);
    await incrementStaffLoginFailures(staff.id, lockoutUntil);

    if (lockoutUntil) {
      throw { status: 423, message: 'Too many failed attempts. Account locked for 30 minutes.' };
    }
    throw { status: 401, message: 'Invalid credentials' };
  }

  await resetStaffLoginFailures(staff.id);

  const payload: AuthTokenPayload = {
    sub:       staff.employee_id,
    userId:    staff.id,
    role:      staff.role,
    firstName: staff.first_name,
    lastName:  staff.last_name,
  };

  return {
    token: signToken(payload),
    user: {
      id:         staff.id,
      role:       staff.role,
      firstName:  staff.first_name,
      lastName:   staff.last_name,
      identifier: staff.employee_id,
    },
  };
}
