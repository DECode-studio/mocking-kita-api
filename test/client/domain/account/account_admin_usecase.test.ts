import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountAdminUseCaseImpl } from '@/src/client/domain/account/usecase/account_admin_usecase_impl';
import { AccountAdminRepository } from '@/src/client/domain/account/repository/account_admin_repository';
import { Account } from '@/src/client/domain/account/entity/account';

describe('AccountAdminUseCaseImpl', () => {
  let repository: Partial<AccountAdminRepository>;
  let useCase: AccountAdminUseCaseImpl;

  const mockAccount: Account = {
    id: 'acc-1',
    username: 'admin',
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    repository = {
      getAll: vi.fn(),
      getSsoDomains: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new AccountAdminUseCaseImpl(repository as AccountAdminRepository);
  });

  it('should call getAll on repository', async () => {
    (repository.getAll as any).mockResolvedValue([mockAccount]);

    const result = await useCase.getAll();

    expect(repository.getAll).toHaveBeenCalled();
    expect(result).toEqual([mockAccount]);
  });

  it('should call getSsoDomains on repository', async () => {
    (repository.getSsoDomains as any).mockResolvedValue(['example.com']);

    const result = await useCase.getSsoDomains();

    expect(repository.getSsoDomains).toHaveBeenCalled();
    expect(result).toEqual(['example.com']);
  });

  it('should call create on repository', async () => {
    const input = { username: 'newuser', name: 'New User', role: 'USER' };
    (repository.create as any).mockResolvedValue(mockAccount);

    const result = await useCase.create(input);

    expect(repository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockAccount);
  });

  it('should call update on repository', async () => {
    const updateInput = { name: 'Updated Name' };
    (repository.update as any).mockResolvedValue({ ...mockAccount, name: 'Updated Name' });

    const result = await useCase.update('acc-1', updateInput);

    expect(repository.update).toHaveBeenCalledWith('acc-1', updateInput);
    expect(result.name).toBe('Updated Name');
  });

  it('should call delete on repository', async () => {
    (repository.delete as any).mockResolvedValue(undefined);

    await useCase.delete('acc-1');

    expect(repository.delete).toHaveBeenCalledWith('acc-1');
  });
});
