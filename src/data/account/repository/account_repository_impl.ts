import { db } from '@/src/core/db/sqlite-client';
import { Account } from '@/src/domain/account/entity/account';
import { AccountRepository } from '@/src/domain/account/repository/account_repository';
import { AccountRow, accountFromRow } from '../model/account_model';

export class AccountRepositoryImpl implements AccountRepository {
  async getAll(): Promise<Account[]> {
    const rows = db.prepare('SELECT * FROM tblAccount ORDER BY username ASC').all() as unknown as AccountRow[];
    return rows.map(accountFromRow);
  }

  async getById(id: string): Promise<Account | null> {
    const row = db.prepare('SELECT * FROM tblAccount WHERE id = ? LIMIT 1').get(id) as unknown as AccountRow | undefined;
    return row ? accountFromRow(row) : null;
  }

  async getByUsername(username: string): Promise<Account | null> {
    const row = db
      .prepare('SELECT * FROM tblAccount WHERE LOWER(username) = ? LIMIT 1')
      .get(username.toLowerCase()) as unknown as AccountRow | undefined;
    return row ? accountFromRow(row) : null;
  }

  async getPasswordHash(id: string): Promise<string | null> {
    const row = db.prepare('SELECT password FROM tblAccount WHERE id = ? LIMIT 1').get(id) as unknown as { password?: string } | undefined;
    return row?.password || null;
  }

  async create(params: {
    id: string;
    username: string;
    passwordHash: string;
    name: string;
    role: string;
  }): Promise<Account> {
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO tblAccount (id, username, password, role, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(params.id, params.username.toLowerCase(), params.passwordHash, params.role, params.name, now, now);

    return {
      id: params.id,
      username: params.username,
      name: params.name,
      role: params.role,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(
    id: string,
    params: {
      username?: string;
      passwordHash?: string;
      name?: string;
      role?: string;
    }
  ): Promise<Account> {
    const current = await this.getById(id);
    if (!current) throw new Error(`Account ${id} not found`);

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (params.username !== undefined) {
      updates.push('username = ?');
      values.push(params.username.toLowerCase());
    }
    if (params.passwordHash !== undefined) {
      updates.push('password = ?');
      values.push(params.passwordHash);
    }
    if (params.name !== undefined) {
      updates.push('name = ?');
      values.push(params.name);
    }
    if (params.role !== undefined) {
      updates.push('role = ?');
      values.push(params.role);
    }

    updates.push('updated_at = ?');
    values.push(now);

    values.push(id);

    const query = `UPDATE tblAccount SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return {
      id,
      username: params.username !== undefined ? params.username : current.username,
      name: params.name !== undefined ? params.name : current.name,
      role: params.role !== undefined ? params.role : current.role,
      createdAt: current.createdAt,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    db.prepare('DELETE FROM tblAccount WHERE id = ?').run(id);
  }
}

export const accountRepository = new AccountRepositoryImpl();
