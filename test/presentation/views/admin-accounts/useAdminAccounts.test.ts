// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminAccounts } from '@/src/presentation/views/admin-accounts/hook/useAdminAccounts';
import * as useCaseProvider from '@/src/di/usecase_provider';

describe('useAdminAccounts', () => {
  let mockUseCase: any;

  beforeEach(() => {
    mockUseCase = {
      getAll: vi.fn().mockResolvedValue([{ id: 'acc-1', username: 'user1', name: 'User 1', role: 'ADMIN' }]),
      getSsoDomains: vi.fn().mockResolvedValue(['example.com']),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    vi.spyOn(useCaseProvider, 'createAccountAdminUseCase').mockReturnValue(mockUseCase);
  });

  it('should fetch accounts and sso domains on mount', async () => {
    const { result } = renderHook(() => useAdminAccounts());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.ssoDomains).toEqual(['example.com']);
    expect(result.current.error).toBeNull();
  });

  it('should set error state if fetch fails', async () => {
    mockUseCase.getAll.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAdminAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('should create account successfully', async () => {
    const newAcc = { id: 'acc-2', username: 'user2', name: 'User 2', role: 'USER' };
    mockUseCase.create.mockResolvedValue(newAcc);

    const { result } = renderHook(() => useAdminAccounts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    let res: any;
    await act(async () => {
      res = await result.current.createAccount({ username: 'user2', name: 'User 2', role: 'USER' });
    });

    expect(res).toEqual({ success: true });
    expect(result.current.accounts).toContainEqual(newAcc);
  });

  it('should return error response when create account fails', async () => {
    mockUseCase.create.mockRejectedValue(new Error('Username exists'));
    const { result } = renderHook(() => useAdminAccounts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    let res: any;
    await act(async () => {
      res = await result.current.createAccount({ username: 'user2', name: 'User 2', role: 'USER' });
    });

    expect(res).toEqual({ success: false, error: 'Username exists' });
  });

  it('should update account successfully', async () => {
    const updatedAcc = { id: 'acc-1', username: 'user1-updated', name: 'User 1 Updated', role: 'ADMIN' };
    mockUseCase.update.mockResolvedValue(updatedAcc);

    const { result } = renderHook(() => useAdminAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res: any;
    await act(async () => {
      res = await result.current.updateAccount('acc-1', { name: 'User 1 Updated' });
    });

    expect(res).toEqual({ success: true });
    expect(result.current.accounts[0].name).toBe('User 1 Updated');
  });

  it('should return error response when update account fails', async () => {
    mockUseCase.update.mockRejectedValue(new Error('Update failed'));
    const { result } = renderHook(() => useAdminAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res: any;
    await act(async () => {
      res = await result.current.updateAccount('acc-1', { name: 'User 1 Updated' });
    });

    expect(res).toEqual({ success: false, error: 'Update failed' });
  });

  it('should delete account successfully', async () => {
    mockUseCase.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAdminAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res: any;
    await act(async () => {
      res = await result.current.deleteAccount('acc-1');
    });

    expect(res).toEqual({ success: true });
    expect(result.current.accounts).toHaveLength(0);
  });

  it('should return error response when delete account fails', async () => {
    mockUseCase.delete.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useAdminAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res: any;
    await act(async () => {
      res = await result.current.deleteAccount('acc-1');
    });

    expect(res).toEqual({ success: false, error: 'Delete failed' });
  });
});
