import pool from '../db/pool';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface StaffRow extends RowDataPacket {
  id: number;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  role: 'staff' | 'admin';
  status: 'active' | 'suspended';
  failed_login_attempts: number;
  lockout_until: Date | null;
  last_login_at: Date | null;
}

export async function findStaffByEmailOrEmployeeId(identifier: string): Promise<StaffRow | null> {
  const [rows] = await pool.execute<StaffRow[]>(
    `SELECT id, employee_id, email, first_name, last_name, password_hash,
            role, status, failed_login_attempts, lockout_until, last_login_at
     FROM staff_users
     WHERE email = ? OR employee_id = ?
     LIMIT 1`,
    [identifier, identifier],
  );
  return rows[0] ?? null;
}

export async function incrementStaffLoginFailures(id: number, lockoutUntil: Date | null): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE staff_users
     SET failed_login_attempts = failed_login_attempts + 1,
         lockout_until = ?
     WHERE id = ?`,
    [lockoutUntil, id],
  );
}

export async function resetStaffLoginFailures(id: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE staff_users
     SET failed_login_attempts = 0,
         lockout_until         = NULL,
         last_login_at         = NOW()
     WHERE id = ?`,
    [id],
  );
}
