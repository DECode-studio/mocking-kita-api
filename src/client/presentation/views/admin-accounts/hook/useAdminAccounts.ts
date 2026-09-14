import { AccountAdminUseCase } from '@/src/client/domain/account/usecase/account_admin_usecase';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { useState, useEffect, useMemo, FormEvent } from 'react';
import { Account } from '@/src/client/domain/account/entity/account';
import { usePageLoadingOverlay } from '@/src/client/presentation/components/shared/PageLoadingOverlay';
import { ROLES_LIST, hasAdminAuthority } from '@/src/core/constants/roles';
import { ADMIN_ACCOUNTS_TEXT } from '../constant';

export function useAdminAccounts(customUseCase?: AccountAdminUseCase) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ssoDomains, setSsoDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageLoading = usePageLoadingOverlay();

  const accountAdminUseCase = useMemo(
    () => customUseCase || getService(CLIENT_DI_TOKENS.accountAdminUseCase),
    [customUseCase]
  );

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Form states
  const [username, setUsername] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLES_LIST[0] || 'Product / Project Manager');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const openAddModal = () => {
    setEditingAccount(null);
    setUsername('');
    setEmailDomain(ssoDomains[0] || '');
    setPassword('');
    setName('');
    setRole(ROLES_LIST[0] || 'Product / Project Manager');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setPassword('');
    setName(account.name);
    setRole(account.role);
    setFormError(null);

    if (account.username.includes('@')) {
      const atIndex = account.username.indexOf('@');
      setUsername(account.username.substring(0, atIndex));
      setEmailDomain(account.username.substring(atIndex + 1));
    } else {
      setUsername(account.username);
      setEmailDomain('');
    }

    setIsFormOpen(true);
  };

  const openDeleteConfirm = (account: Account) => {
    setAccountToDelete(account);
    setIsConfirmDeleteOpen(true);
  };

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
          const updated = await accountAdminUseCase.update(id, data);
          setAccounts((prev) => prev.map((acc) => (acc.id === id ? updated : acc)));
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!username.trim() || !name.trim() || (!editingAccount && hasAdminAuthority(role) && !password)) {
      setFormError(ADMIN_ACCOUNTS_TEXT.REQUIRED_FIELDS_ERROR);
      setIsSubmitting(false);
      return;
    }

    const targetUsername = emailDomain.trim()
      ? `${username.trim()}@${emailDomain.trim()}`
      : username.trim();

    const payload = {
      username: targetUsername,
      name: name.trim(),
      role,
      ...(password ? { password } : {}),
    };

    let result;
    if (editingAccount) {
      result = await updateAccount(editingAccount.id, payload);
    } else {
      result = await createAccount(payload);
    }

    setIsSubmitting(false);

    if (result.success) {
      setIsFormOpen(false);
    } else {
      setFormError(result.error || ADMIN_ACCOUNTS_TEXT.OPERATION_FAILED_ERROR);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    await deleteAccount(accountToDelete.id);
    setAccountToDelete(null);
    setIsConfirmDeleteOpen(false);
  };

  const filteredAccounts = accounts.filter((account) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      account.username.toLowerCase().includes(query) ||
      account.name.toLowerCase().includes(query) ||
      account.role.toLowerCase().includes(query);

    const matchesRole = roleFilter === 'All' || account.role === roleFilter;

    return matchesQuery && matchesRole;
  });

  return {
    accounts,
    ssoDomains,
    loading,
    error,
    refresh: fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    // Dialog states
    isFormOpen,
    setIsFormOpen,
    editingAccount,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    accountToDelete,
    // Filter states
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    filteredAccounts,
    // Form states & handlers
    username,
    setUsername,
    emailDomain,
    setEmailDomain,
    password,
    setPassword,
    name,
    setName,
    role,
    setRole,
    formError,
    isSubmitting,
    openAddModal,
    openEditModal,
    openDeleteConfirm,
    handleSubmit,
    handleDeleteConfirm,
  };
}
