import { useState, useEffect, useMemo } from 'react';
import { Account } from '@/src/domain/account/entity/account';
import { createAccountAdminUseCase } from '@/src/di/usecase_provider';
import { usePageLoadingOverlay } from '@/src/presentation/components/shared/PageLoadingOverlay';

export function useAdminAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ssoDomains, setSsoDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageLoading = usePageLoadingOverlay();

  const accountAdminUseCase = useMemo(() => createAccountAdminUseCase(), []);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountAdminUseCase.getAll();
      const domains = await accountAdminUseCase.getSsoDomains();
      setAccounts(data);
      setSsoDomains(domains);
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
    return pageLoading.run(
      {
        title: `Membuat akun "${data.name}"`,
        description: 'Akun baru sedang dibuat dan akan muncul di daftar admin.',
      },
      async () => {
        try {
          const account = await accountAdminUseCase.create(data);
          setAccounts((prev) => [...prev, account]);
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Failed to create account' };
        }
      }
    );
  };

  const updateAccount = async (id: string, data: { username?: string; password?: string; name?: string; role?: string }) => {
    const account = accounts.find((item) => item.id === id);
    return pageLoading.run(
      {
        title: `Menyimpan akun "${data.name || account?.name || 'ini'}"`,
        description: 'Nama, role, atau password akun sedang diperbarui.',
      },
      async () => {
        try {
          const account = await accountAdminUseCase.update(id, data);
          setAccounts((prev) => prev.map((acc) => (acc.id === id ? account : acc)));
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Failed to update account' };
        }
      }
    );
  };

  const deleteAccount = async (id: string) => {
    const account = accounts.find((item) => item.id === id);
    return pageLoading.run(
      {
        title: `Menghapus akun${account ? ` "${account.name}"` : ''}`,
        description: 'Akun sedang dihapus dan tidak akan bisa digunakan untuk masuk.',
      },
      async () => {
        try {
          await accountAdminUseCase.delete(id);
          setAccounts((prev) => prev.filter((acc) => acc.id !== id));
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Failed to delete account' };
        }
      }
    );
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
