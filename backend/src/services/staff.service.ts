import bcrypt from 'bcrypt';
import pool from '../db/pool';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const BCRYPT_ROUNDS          = Number(process.env.BCRYPT_ROUNDS ?? 12);
const DEFAULT_STAFF_PASSWORD = 'Staff@1234';

export interface StaffUser {
  id:            number;
  employee_id:   string;
  email:         string;
  first_name:    string;
  last_name:     string;
  role:          'staff' | 'admin';
  status:        'active' | 'suspended';
  last_login_at: string | null;
  created_at:    string;
}

export interface StaffListResult {
  data:  StaffUser[];
  total: number;
  page:  number;
  limit: number;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listStaff(opts: {
  page:   number;
  limit:  number;
  search: string;
  role:   string;
  status: string;
}): Promise<StaffListResult> {
  const { page, limit, search, role, status } = opts;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR employee_id LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (role && role !== 'all') {
    conditions.push('role = ?');
    params.push(role);
  }
  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM staff_users ${where}`,
    params,
  );
  const total = (countRows[0] as { total: number }).total;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, employee_id, email, first_name, last_name, role, status, last_login_at, created_at
     FROM staff_users
     ${where}
     ORDER BY created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return { data: rows as StaffUser[], total, page, limit };
}

export async function getStaffById(id: number): Promise<StaffUser> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, employee_id, email, first_name, last_name, role, status, last_login_at, created_at
     FROM staff_users WHERE id = ? LIMIT 1`,
    [id],
  );
  if ((rows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: 'Staff user not found.' };
  }
  return rows[0] as StaffUser;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createStaff(payload: {
  firstName: string;
  lastName:  string;
  email:     string;
  role:      'staff' | 'admin';
}): Promise<{ staffId: number; employeeId: string }> {
  const { firstName, lastName, email, role } = payload;

  const [existing] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM staff_users WHERE email = ? LIMIT 1',
    [email],
  );
  if ((existing as RowDataPacket[]).length > 0) {
    throw { status: 409, message: 'A staff account with this email already exists.' };
  }

  const passwordHash = await bcrypt.hash(DEFAULT_STAFF_PASSWORD, BCRYPT_ROUNDS);
  const connection   = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO staff_users (employee_id, email, first_name, last_name, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      ['PENDING', email, firstName, lastName, passwordHash, role],
    );

    const staffId    = result.insertId;
    const employeeId = `EMP-${String(staffId).padStart(5, '0')}`;

    await connection.execute<ResultSetHeader>(
      'UPDATE staff_users SET employee_id = ? WHERE id = ?',
      [employeeId, staffId],
    );

    await connection.commit();
    return { staffId, employeeId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function updateStaff(
  id:      number,
  payload: { firstName: string; lastName: string; email: string; role: 'staff' | 'admin' },
): Promise<void> {
  await getStaffById(id);

  const [existing] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM staff_users WHERE email = ? AND id != ? LIMIT 1',
    [payload.email, id],
  );
  if ((existing as RowDataPacket[]).length > 0) {
    throw { status: 409, message: 'Another staff account with this email already exists.' };
  }

  await pool.execute<ResultSetHeader>(
    'UPDATE staff_users SET first_name = ?, last_name = ?, email = ?, role = ? WHERE id = ?',
    [payload.firstName, payload.lastName, payload.email, payload.role, id],
  );
}

// ── Self-service: profile & password ─────────────────────────────────────────

export async function updateMyStaffProfile(
  staffId: number,
  payload: { firstName: string; lastName: string; email: string },
): Promise<void> {
  const [existing] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM staff_users WHERE email = ? AND id != ? LIMIT 1',
    [payload.email, staffId],
  );
  if ((existing as RowDataPacket[]).length > 0) {
    throw { status: 409, message: 'Another account with this email already exists.' };
  }
  await pool.execute<ResultSetHeader>(
    'UPDATE staff_users SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
    [payload.firstName, payload.lastName, payload.email, staffId],
  );
}

export async function changeMyStaffPassword(
  staffId:         number,
  currentPassword: string,
  newPassword:     string,
): Promise<void> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT password_hash FROM staff_users WHERE id = ? LIMIT 1',
    [staffId],
  );
  if ((rows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: 'Staff user not found.' };
  }
  const { password_hash } = rows[0] as { password_hash: string };
  const valid = await bcrypt.compare(currentPassword, password_hash);
  if (!valid) {
    throw { status: 400, message: 'Current password is incorrect.' };
  }
  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await pool.execute<ResultSetHeader>(
    'UPDATE staff_users SET password_hash = ? WHERE id = ?',
    [newHash, staffId],
  );
}

export async function updateStaffStatus(
  id:     number,
  status: 'active' | 'suspended',
): Promise<void> {
  await getStaffById(id);
  await pool.execute<ResultSetHeader>(
    'UPDATE staff_users SET status = ? WHERE id = ?',
    [status, id],
  );
}
