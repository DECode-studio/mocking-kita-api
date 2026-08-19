import { useState, useEffect } from 'react';
import { Account } from '@/src/domain/account/entity/account';
import { apiRequest } from '@/src/core/http-client/api-client';

export function useAdminAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ssoDomains, setSsoDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ success: boolean; accounts: Account[]; ssoDomains?: string[] }>('/api/admin/accounts');
      if (res.success) {
        setAccounts(res.accounts);
        if (res.ssoDomains) {
          setSsoDomains(res.ssoDomains);
        }
      } else {
        setError('Failed to load accounts');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAccounts();
  }, []);

  const createAccount = async (data: { username: string; password?: string; name: string; role: string }) => {
    try {
      const res = await apiRequest<{ success: boolean; account: Account; error?: string }>('/api/admin/accounts', {
        method: 'POST',
        body: data,
      });
      if (res.success) {
        setAccounts((prev) => [...prev, res.account]);
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to create account' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create account' };
    }
  };

  const updateAccount = async (id: string, data: { username?: string; password?: string; name?: string; role?: string }) => {
    try {
      const res = await apiRequest<{ success: boolean; account: Account; error?: string }>('/api/admin/accounts', {
        method: 'PUT',
        body: { id, ...data },
      });
      if (res.success) {
        setAccounts((prev) => prev.map((acc) => (acc.id === id ? res.account : acc)));
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to update account' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update account' };
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const res = await apiRequest<{ success: boolean; error?: string }>('/api/admin/accounts', {
        method: 'DELETE',
        body: { id },
      });
      if (res.success) {
        setAccounts((prev) => prev.filter((acc) => acc.id !== id));
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to delete account' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete account' };
    }
  };

  return {
    accounts,
    ssoDomains,
    loading,
    error,
    refresh: fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
