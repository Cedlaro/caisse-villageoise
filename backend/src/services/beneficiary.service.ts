import pool from '../db/pool';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Beneficiary {
  id:           number;
  member_id:    number;
  full_name:    string;
  relationship: string;
  percentage:   number;
  created_at:   string;
}

async function getAllocatedSum(memberId: number, excludeId?: number): Promise<number> {
  let sql = 'SELECT COALESCE(SUM(percentage), 0) AS total FROM beneficiaries WHERE member_id = ?';
  const params: number[] = [memberId];
  if (excludeId !== undefined) { sql += ' AND id != ?'; params.push(excludeId); }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return Number((rows[0] as { total: number }).total);
}

export async function getBeneficiariesByMember(memberId: number): Promise<Beneficiary[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, member_id, full_name, relationship, percentage, created_at
     FROM beneficiaries WHERE member_id = ? ORDER BY created_at ASC`,
    [memberId],
  );
  return rows as Beneficiary[];
}

export async function addBeneficiary(payload: {
  memberId:     number;
  fullName:     string;
  relationship: string;
  percentage:   number;
}): Promise<{ beneficiaryId: number }> {
  const { memberId, fullName, relationship, percentage } = payload;

  const [memberRows] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM members WHERE id = ? LIMIT 1',
    [memberId],
  );
  if ((memberRows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: 'Member not found.' };
  }

  const allocated = await getAllocatedSum(memberId);
  if (allocated + percentage > 100) {
    throw {
      status:  400,
      message: `Adding ${percentage}% would exceed 100%. Currently allocated: ${allocated}%.`,
    };
  }

  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO beneficiaries (member_id, full_name, relationship, percentage) VALUES (?, ?, ?, ?)',
    [memberId, fullName, relationship, percentage],
  );
  return { beneficiaryId: result.insertId };
}

export async function editBeneficiary(id: number, payload: {
  fullName:     string;
  relationship: string;
  percentage:   number;
}): Promise<void> {
  const { fullName, relationship, percentage } = payload;

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, member_id FROM beneficiaries WHERE id = ? LIMIT 1',
    [id],
  );
  if ((rows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: 'Beneficiary not found.' };
  }
  const { member_id } = rows[0] as { member_id: number };

  const allocated = await getAllocatedSum(member_id, id);
  if (allocated + percentage > 100) {
    throw {
      status:  400,
      message: `This update would exceed 100%. Other beneficiaries already use ${allocated}%.`,
    };
  }

  await pool.execute<ResultSetHeader>(
    'UPDATE beneficiaries SET full_name = ?, relationship = ?, percentage = ? WHERE id = ?',
    [fullName, relationship, percentage, id],
  );
}

export async function removeBeneficiary(id: number): Promise<void> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM beneficiaries WHERE id = ? LIMIT 1',
    [id],
  );
  if ((rows as RowDataPacket[]).length === 0) {
    throw { status: 404, message: 'Beneficiary not found.' };
  }
  await pool.execute<ResultSetHeader>('DELETE FROM beneficiaries WHERE id = ?', [id]);
}
