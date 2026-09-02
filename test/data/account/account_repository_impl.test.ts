import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountRepositoryImpl } from '@/src/data/account/repository/account_repository_impl';
import prisma from '@/src/core/db/prisma-client';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    account: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('AccountRepositoryImpl', () => {
  let repository: AccountRepositoryImpl;
  const now = new Date();
  const mockRow = {
    id: 'acc-1',
    username: 'admin',
    password: 'hashedpassword',
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    repository = new AccountRepositoryImpl();
    vi.clearAllMocks();
  });

  it('getAll should fetch accounts sorted by username', async () => {
    (prisma.account.findMany as any).mockResolvedValue([mockRow]);

    const result = await repository.getAll();

    expect(prisma.account.findMany).toHaveBeenCalledWith({
      orderBy: { username: 'asc' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('admin');
  });

  it('getById should return account domain model or null', async () => {
    (prisma.account.findUnique as any).mockResolvedValue(mockRow);

    const result = await repository.getById('acc-1');

    expect(prisma.account.findUnique).toHaveBeenCalledWith({ where: { id: 'acc-1' } });
    expect(result?.name).toBe('Admin User');

    (prisma.account.findUnique as any).mockResolvedValue(null);
    const nullResult = await repository.getById('non-existent');
    expect(nullResult).toBeNull();
  });

  it('getByUsername should query lowercased username', async () => {
    (prisma.account.findUnique as any).mockResolvedValue(mockRow);

    const result = await repository.getByUsername('ADMIN');

    expect(prisma.account.findUnique).toHaveBeenCalledWith({ where: { username: 'admin' } });
    expect(result?.id).toBe('acc-1');
  });

  it('getPasswordHash should select password field', async () => {
    (prisma.account.findUnique as any).mockResolvedValue({ password: 'hashedpassword' });

    const hash = await repository.getPasswordHash('acc-1');

    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      select: { password: true },
    });
    expect(hash).toBe('hashedpassword');
  });

  it('create should create account with lowercased username', async () => {
    (prisma.account.create as any).mockResolvedValue(mockRow);

    const created = await repository.create({
      id: 'acc-1',
      username: 'ADMIN',
      passwordHash: 'hashedpassword',
      name: 'Admin User',
      role: 'ADMIN',
    });

    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        id: 'acc-1',
        username: 'admin',
        password: 'hashedpassword',
        name: 'Admin User',
        role: 'ADMIN',
      },
    });
    expect(created.id).toBe('acc-1');
  });

  it('update and delete should call prisma update and delete', async () => {
    (prisma.account.update as any).mockResolvedValue({ ...mockRow, name: 'Updated Name' });
    (prisma.account.delete as any).mockResolvedValue(mockRow);

    const updated = await repository.update('acc-1', { name: 'Updated Name' });
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      data: { name: 'Updated Name' },
    });
    expect(updated.name).toBe('Updated Name');

    await repository.delete('acc-1');
    expect(prisma.account.delete).toHaveBeenCalledWith({ where: { id: 'acc-1' } });
  });
});
