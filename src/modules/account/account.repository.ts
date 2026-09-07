import prisma from '@/src/core/db/prisma-client';
import { Account } from '@/src/domain/account/entity/account';
import { AccountRepository } from '@/src/domain/account/repository/account_repository';
import { toAccountDomain } from './account.mapper';

export class AccountRepositoryImpl implements AccountRepository {
  async getAll(): Promise<Account[]> {
    const rows = await prisma.account.findMany({
      orderBy: { username: 'asc' },
    });
    return rows.map(toAccountDomain);
  }

  async getById(id: string): Promise<Account | null> {
    const row = await prisma.account.findUnique({
      where: { id },
    });
    return row ? toAccountDomain(row) : null;
  }

  async getByUsername(username: string): Promise<Account | null> {
    const row = await prisma.account.findUnique({
      where: { username: username.toLowerCase() },
    });
    return row ? toAccountDomain(row) : null;
  }

  async getPasswordHash(id: string): Promise<string | null> {
    const row = await prisma.account.findUnique({
      where: { id },
      select: { password: true },
    });
    return row?.password || null;
  }

  async create(params: {
    id: string;
    username: string;
    passwordHash: string;
    name: string;
    role: string;
    googleId?: string | null;
  }): Promise<Account> {
    const row = await prisma.account.create({
      data: {
        id: params.id,
        username: params.username.toLowerCase(),
        password: params.passwordHash,
        role: params.role,
        name: params.name,
        googleId: params.googleId ?? null,
      },
    });

    return toAccountDomain(row);
  }

  async update(
    id: string,
    params: {
      username?: string;
      passwordHash?: string;
      name?: string;
      role?: string;
      googleId?: string | null;
    }
  ): Promise<Account> {
    const updated = await prisma.account.update({
      where: { id },
      data: {
        ...(params.username !== undefined && { username: params.username.toLowerCase() }),
        ...(params.passwordHash !== undefined && { password: params.passwordHash }),
        ...(params.name !== undefined && { name: params.name }),
        ...(params.role !== undefined && { role: params.role }),
        ...(params.googleId !== undefined && { googleId: params.googleId }),
      },
    });

    return toAccountDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.account.delete({
      where: { id },
    });
  }
}

export const accountRepository = new AccountRepositoryImpl();
