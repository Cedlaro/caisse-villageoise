import pool from '../db/pool';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface SavingsAccount {
  id:             number;
  member_id:      number;
  account_number: string;
  account_type:   'share_capital' | 'regular' | 'fixed';
  balance:        string;
  created_at:     string;
}

export interface AccountWithMember extends SavingsAccount {
  first_name:    string;
  last_name:     string;
  email:         string | null;
  member_number: string;
}

export interface Transaction {
  id:                    number;
  account_id:            number;
  transaction_type:      'deposit' | 'withdrawal' | 'transfer' | 'loan_repayment';
  amount:                string;
  reference_id:          string;
  processed_by_staff_id: number | null;
  processed_by_name:     string | null;
  created_at:            string;
}

export interface TransactionListResult {
  data:  Transaction[];
  total: number;
  page:  number;
  limit: number;
}

export interface AccountListResult {
  data:  AccountWithMember[];
  total: number;
  page:  number;
  limit: number;
}

function generateReference(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getAccountByMemberId(memberId: number): Promise<SavingsAccount> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, member_id, account_number, account_type, balance, created_at
     FROM savings_accounts WHERE member_id = ? LIMIT 1`,
    [memberId],
  );
  if ((rows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: 'No savings account found for this member.' };
  }
  return rows[0] as SavingsAccount;
}

export async function getAccountById(id: number): Promise<AccountWithMember> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT sa.id, sa.member_id, sa.account_number, sa.account_type, sa.balance, sa.created_at,
            m.first_name, m.last_name, m.email, m.member_number
     FROM savings_accounts sa
     JOIN members m ON m.id = sa.member_id
     WHERE sa.id = ? LIMIT 1`,
    [id],
  );
  if ((rows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: 'Account not found.' };
  }
  return rows[0] as AccountWithMember;
}

export async function listAccounts(opts: { page: number; limit: number; search: string }): Promise<AccountListResult> {
  const { page, limit, search } = opts;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push(
      '(m.first_name LIKE ? OR m.last_name LIKE ? OR m.member_number LIKE ? OR sa.account_number LIKE ?)',
    );
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM savings_accounts sa JOIN members m ON m.id = sa.member_id ${where}`,
    params,
  );
  const total = (countRows[0] as { total: number }).total;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT sa.id, sa.member_id, sa.account_number, sa.account_type, sa.balance, sa.created_at,
            m.first_name, m.last_name, m.email, m.member_number
     FROM savings_accounts sa
     JOIN members m ON m.id = sa.member_id
     ${where}
     ORDER BY sa.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return { data: rows as AccountWithMember[], total, page, limit };
}

export async function getTransactions(
  accountId: number,
  opts: { page: number; limit: number },
): Promise<TransactionListResult> {
  const { page, limit } = opts;
  const offset = (page - 1) * limit;

  const [countRows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM transactions WHERE account_id = ?',
    [accountId],
  );
  const total = (countRows[0] as { total: number }).total;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT t.id, t.account_id, t.transaction_type, t.amount, t.reference_id,
            t.processed_by_staff_id, t.created_at,
            CONCAT(s.first_name, ' ', s.last_name) AS processed_by_name
     FROM transactions t
     LEFT JOIN staff_users s ON s.id = t.processed_by_staff_id
     WHERE t.account_id = ?
     ORDER BY t.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    [accountId],
  );

  return { data: rows as Transaction[], total, page, limit };
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function deposit(accountId: number, amount: number, staffId: number): Promise<void> {
  await getAccountById(accountId);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute<ResultSetHeader>(
      `INSERT INTO transactions (account_id, transaction_type, amount, reference_id, processed_by_staff_id)
       VALUES (?, 'deposit', ?, ?, ?)`,
      [accountId, amount, generateReference(), staffId],
    );
    await connection.execute<ResultSetHeader>(
      'UPDATE savings_accounts SET balance = balance + ? WHERE id = ?',
      [amount, accountId],
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function withdraw(accountId: number, amount: number, staffId: number): Promise<void> {
  const account = await getAccountById(accountId);
  if (Number(account.balance) < amount) {
    throw { status: 400, message: 'Insufficient account balance.' };
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute<ResultSetHeader>(
      `INSERT INTO transactions (account_id, transaction_type, amount, reference_id, processed_by_staff_id)
       VALUES (?, 'withdrawal', ?, ?, ?)`,
      [accountId, amount, generateReference(), staffId],
    );
    await connection.execute<ResultSetHeader>(
      'UPDATE savings_accounts SET balance = balance - ? WHERE id = ?',
      [amount, accountId],
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function transfer(
  fromAccountId: number,
  toAccountId:   number,
  amount:        number,
  staffId:       number,
): Promise<void> {
  if (fromAccountId === toAccountId) {
    throw { status: 400, message: 'Cannot transfer to the same account.' };
  }
  const fromAccount = await getAccountById(fromAccountId);
  await getAccountById(toAccountId);
  if (Number(fromAccount.balance) < amount) {
    throw { status: 400, message: 'Insufficient account balance.' };
  }
  const refBase    = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute<ResultSetHeader>(
      `INSERT INTO transactions (account_id, transaction_type, amount, reference_id, processed_by_staff_id)
       VALUES (?, 'transfer', ?, ?, ?)`,
      [fromAccountId, amount, `${refBase}-OUT`, staffId],
    );
    await connection.execute<ResultSetHeader>(
      `INSERT INTO transactions (account_id, transaction_type, amount, reference_id, processed_by_staff_id)
       VALUES (?, 'transfer', ?, ?, ?)`,
      [toAccountId, amount, `${refBase}-IN`, staffId],
    );
    await connection.execute<ResultSetHeader>(
      'UPDATE savings_accounts SET balance = balance - ? WHERE id = ?',
      [amount, fromAccountId],
    );
    await connection.execute<ResultSetHeader>(
      'UPDATE savings_accounts SET balance = balance + ? WHERE id = ?',
      [amount, toAccountId],
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
