import pool from '../db/pool';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export type LoanStatus = 'applied' | 'under_review' | 'approved' | 'active' | 'defaulted' | 'paid';

export interface Loan {
  id:                   number;
  member_id:            number;
  loan_amount:          string;
  interest_rate:        string;
  term_months:          number;
  status:               LoanStatus;
  remaining_balance:    string;
  reviewed_by_staff_id: number | null;
  created_at:           string;
}

export interface LoanWithMember extends Loan {
  first_name:       string;
  last_name:        string;
  member_number:    string;
  reviewed_by_name: string | null;
}

export interface LoanListResult {
  data:  LoanWithMember[];
  total: number;
  page:  number;
  limit: number;
}

const TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  applied:      ['under_review'],
  under_review: ['approved', 'applied'],
  approved:     ['active'],
  active:       ['defaulted'],
  defaulted:    [],
  paid:         [],
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getLoanById(id: number): Promise<LoanWithMember> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT l.id, l.member_id, l.loan_amount, l.interest_rate, l.term_months,
            l.status, l.remaining_balance, l.reviewed_by_staff_id, l.created_at,
            m.first_name, m.last_name, m.member_number,
            CONCAT(s.first_name, ' ', s.last_name) AS reviewed_by_name
     FROM loans l
     JOIN members m ON m.id = l.member_id
     LEFT JOIN staff_users s ON s.id = l.reviewed_by_staff_id
     WHERE l.id = ? LIMIT 1`,
    [id],
  );
  if ((rows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: 'Loan not found.' };
  }
  return rows[0] as LoanWithMember;
}

export async function getLoansByMemberId(memberId: number): Promise<Loan[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, member_id, loan_amount, interest_rate, term_months,
            status, remaining_balance, reviewed_by_staff_id, created_at
     FROM loans WHERE member_id = ? ORDER BY created_at DESC`,
    [memberId],
  );
  return rows as Loan[];
}

export async function listLoans(opts: {
  page:   number;
  limit:  number;
  status: string;
  search: string;
}): Promise<LoanListResult> {
  const { page, limit, status, search } = opts;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status && status !== 'all') {
    conditions.push('l.status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(m.first_name LIKE ? OR m.last_name LIKE ? OR m.member_number LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM loans l JOIN members m ON m.id = l.member_id ${where}`,
    params,
  );
  const total = (countRows[0] as { total: number }).total;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.id, l.member_id, l.loan_amount, l.interest_rate, l.term_months,
            l.status, l.remaining_balance, l.reviewed_by_staff_id, l.created_at,
            m.first_name, m.last_name, m.member_number,
            CONCAT(s.first_name, ' ', s.last_name) AS reviewed_by_name
     FROM loans l
     JOIN members m ON m.id = l.member_id
     LEFT JOIN staff_users s ON s.id = l.reviewed_by_staff_id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return { data: rows as LoanWithMember[], total, page, limit };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createLoanByAdmin(payload: {
  memberNumber: string;
  loanAmount:   number;
  interestRate: number;
  termMonths:   number;
  staffId:      number;
}): Promise<{ loanId: number }> {
  const { memberNumber, loanAmount, interestRate, termMonths, staffId } = payload;

  const [memberRows] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM members WHERE member_number = ? LIMIT 1',
    [memberNumber],
  );
  if ((memberRows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: `Member '${memberNumber}' not found.` };
  }
  const memberId = (memberRows[0] as { id: number }).id;

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO loans (member_id, loan_amount, interest_rate, term_months, status, remaining_balance, reviewed_by_staff_id)
     VALUES (?, ?, ?, ?, 'applied', ?, ?)`,
    [memberId, loanAmount, interestRate, termMonths, loanAmount, staffId],
  );
  return { loanId: result.insertId };
}

export async function updateLoan(
  id:      number,
  payload: { loanAmount: number; interestRate: number; termMonths: number },
): Promise<void> {
  const loan = await getLoanById(id);
  if (!['applied', 'under_review'].includes(loan.status)) {
    throw { status: 400, message: 'Only loans with status Applied or Under Review can be edited.' };
  }
  const { loanAmount, interestRate, termMonths } = payload;
  await pool.execute<ResultSetHeader>(
    'UPDATE loans SET loan_amount = ?, interest_rate = ?, term_months = ?, remaining_balance = ? WHERE id = ?',
    [loanAmount, interestRate, termMonths, loanAmount, id],
  );
}

export async function applyForLoan(payload: {
  memberId:     number;
  loanAmount:   number;
  interestRate: number;
  termMonths:   number;
}): Promise<{ loanId: number }> {
  const { memberId, loanAmount, interestRate, termMonths } = payload;
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO loans (member_id, loan_amount, interest_rate, term_months, status, remaining_balance)
     VALUES (?, ?, ?, ?, 'applied', ?)`,
    [memberId, loanAmount, interestRate, termMonths, loanAmount],
  );
  return { loanId: result.insertId };
}

export async function updateLoanStatus(
  id:        number,
  newStatus: LoanStatus,
  staffId:   number,
): Promise<void> {
  const loan = await getLoanById(id);
  if (!TRANSITIONS[loan.status].includes(newStatus)) {
    throw {
      status:  400,
      message: `Cannot transition loan from '${loan.status}' to '${newStatus}'.`,
    };
  }
  await pool.execute<ResultSetHeader>(
    'UPDATE loans SET status = ?, reviewed_by_staff_id = ? WHERE id = ?',
    [newStatus, staffId, id],
  );
}

export async function recordRepayment(
  loanId:  number,
  amount:  number,
  staffId: number,
): Promise<void> {
  const loan = await getLoanById(loanId);
  if (loan.status !== 'active') {
    throw { status: 400, message: 'Only active loans can receive repayments.' };
  }
  const remaining = Number(loan.remaining_balance);
  if (amount > remaining) {
    throw { status: 400, message: `Amount exceeds remaining balance of RS ${remaining.toFixed(2)}.` };
  }

  const [accRows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, balance FROM savings_accounts WHERE member_id = ? LIMIT 1',
    [loan.member_id],
  );
  if ((accRows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: 'Member savings account not found.' };
  }
  const account = accRows[0] as { id: number; balance: string };
  if (Number(account.balance) < amount) {
    throw { status: 400, message: 'Insufficient savings account balance for repayment.' };
  }

  const newRemaining = +(remaining - amount).toFixed(2);
  const newStatus: LoanStatus = newRemaining === 0 ? 'paid' : 'active';
  const refId = `RPY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute<ResultSetHeader>(
      `INSERT INTO transactions (account_id, transaction_type, amount, reference_id, processed_by_staff_id)
       VALUES (?, 'loan_repayment', ?, ?, ?)`,
      [account.id, amount, refId, staffId],
    );
    await connection.execute<ResultSetHeader>(
      'UPDATE savings_accounts SET balance = balance - ? WHERE id = ?',
      [amount, account.id],
    );
    await connection.execute<ResultSetHeader>(
      'UPDATE loans SET remaining_balance = ?, status = ?, reviewed_by_staff_id = ? WHERE id = ?',
      [newRemaining, newStatus, staffId, loanId],
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
