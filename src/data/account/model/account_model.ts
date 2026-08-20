import { Account } from '@/src/domain/account/entity/account';

export interface AccountRow {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export function accountFromRow(row: AccountRow): Account {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
