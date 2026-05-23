import pool from '../db/pool';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface MemberRow extends RowDataPacket {
  id: number;
  member_number: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  status: 'pending_kyc' | 'active' | 'suspended';
  failed_login_attempts: number;
  lockout_until: Date | null;
  last_login_at: Date | null;
}

export async function findMemberByEmailOrNumber(identifier: string): Promise<MemberRow | null> {
  const [rows] = await pool.execute<MemberRow[]>(
    `SELECT id, member_number, email, first_name, last_name, password_hash,
            status, failed_login_attempts, lockout_until, last_login_at
     FROM members
     WHERE email = ? OR member_number = ?
     LIMIT 1`,
    [identifier, identifier],
  );
  return rows[0] ?? null;
}

export async function incrementMemberLoginFailures(id: number, lockoutUntil: Date | null): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE members
     SET failed_login_attempts = failed_login_attempts + 1,
         lockout_until = ?
     WHERE id = ?`,
    [lockoutUntil, id],
  );
}

export async function resetMemberLoginFailures(id: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE members
     SET failed_login_attempts = 0,
         lockout_until         = NULL,
         last_login_at         = NOW()
     WHERE id = ?`,
    [id],
  );
}
