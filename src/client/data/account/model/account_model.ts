import { Account } from '@/src/client/domain/account/entity/account';

export interface AccountRow {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: string;
  google_id?: string | null;
  created_at: string;
  updated_at: string;
}

export function accountFromRow(row: AccountRow): Account {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    googleId: row.google_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
