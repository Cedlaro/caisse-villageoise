import bcrypt from 'bcrypt';
import pool from '../db/pool';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

export interface RegisterPayload {
  firstName:   string;
  lastName:    string;
  email:       string;
  phone:       string;
  dob:         string;
  address:     string;
  password:    string;
}

export interface MemberSummary {
  id:            number;
  member_number: string;
  email:         string;
  first_name:    string;
  last_name:     string;
  phone:         string | null;
  status:        'pending_kyc' | 'active' | 'suspended';
  created_at:    string;
}

export interface MemberDetail extends MemberSummary {
  address:      string | null;
  dob:          string | null;
  last_login_at: string | null;
}

export interface MemberListResult {
  data:  MemberSummary[];
  total: number;
  page:  number;
  limit: number;
}

// ── Registration ──────────────────────────────────────────────────────────────

export async function registerMember(payload: RegisterPayload): Promise<{ memberId: number; memberNumber: string }> {
  const { firstName, lastName, email, phone, dob, address, password } = payload;

  const existing = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM members WHERE email = ? LIMIT 1',
    [email],
  );
  if ((existing[0] as RowDataPacket[]).length > 0) {
    throw { status: 409, message: 'An account with this email already exists.' };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO members
         (member_number, email, first_name, last_name, phone, dob, address, password_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_kyc')`,
      ['PENDING', email, firstName, lastName, phone, dob, address, passwordHash],
    );

    const memberId     = result.insertId;
    const memberNumber = `MBR-${String(memberId).padStart(5, '0')}`;

    await connection.execute<ResultSetHeader>(
      'UPDATE members SET member_number = ? WHERE id = ?',
      [memberNumber, memberId],
    );

    const accountNumber = `ACC-${String(memberId).padStart(7, '0')}`;
    await connection.execute<ResultSetHeader>(
      `INSERT INTO savings_accounts (member_id, account_number, account_type, balance)
       VALUES (?, ?, 'share_capital', 0.00)`,
      [memberId, accountNumber],
    );

    await connection.commit();
    return { memberId, memberNumber };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// ── Admin: list members ───────────────────────────────────────────────────────

export async function listMembers(opts: {
  page:   number;
  limit:  number;
  search: string;
  status: string;
}): Promise<MemberListResult> {
  const { page, limit, search, status } = opts;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push('(m.first_name LIKE ? OR m.last_name LIKE ? OR m.email LIKE ? OR m.member_number LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (status && status !== 'all') {
    conditions.push('m.status = ?');
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM members m ${where}`,
    params,
  );
  const total = (countRows[0] as { total: number }).total;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT m.id, m.member_number, m.email, m.first_name, m.last_name,
            m.phone, m.status, m.created_at
     FROM members m
     ${where}
     ORDER BY m.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return {
    data:  rows as MemberSummary[],
    total,
    page,
    limit,
  };
}

// ── Admin: get single member ──────────────────────────────────────────────────

export async function getMemberById(id: number): Promise<MemberDetail> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, member_number, email, first_name, last_name, phone,
            address, dob, status, last_login_at, created_at
     FROM members WHERE id = ? LIMIT 1`,
    [id],
  );
  if ((rows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: 'Member not found.' };
  }
  return rows[0] as MemberDetail;
}

// ── Admin: update status ──────────────────────────────────────────────────────

export async function updateMemberStatus(
  id: number,
  status: 'active' | 'suspended',
): Promise<void> {
  await getMemberById(id);
  await pool.execute<ResultSetHeader>(
    'UPDATE members SET status = ? WHERE id = ?',
    [status, id],
  );
}
