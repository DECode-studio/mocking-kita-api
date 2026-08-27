'use client';

import React, { useState } from 'react';
import { useAdminAccounts } from './useAdminAccounts';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Plus, Shield, User, RefreshCw, AlertCircle, Search } from 'lucide-react';
import { Account } from '@/src/domain/account/entity/account';
import { ROLES_LIST, hasAdminAuthority } from '@/src/core/constants/roles';
import { AccountsSearchFilter, AccountFormModal, AccountListItem } from './components';
import { ADMIN_ACCOUNTS_TEXT, ADMIN_ACCOUNTS_SEMANTIC_ID } from './constant';

export const AccountsAdminView: React.FC = () => {
  const {
    accounts,
    ssoDomains,
    loading,
    error,
    refresh,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useAdminAccounts();

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

  const openAddModal = () => {
    setEditingAccount(null);
    setUsername('');
    setEmailDomain(ssoDomains[0] || 'finansia.com');
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

    if (hasAdminAuthority(account.role)) {
      if (account.username.includes('@')) {
        const parts = account.username.split('@');
        setUsername(parts[0] || '');
        setEmailDomain(parts[1] || ssoDomains[0] || 'finansia.com');
      } else {
        setUsername(account.username);
        setEmailDomain('');
      }
    } else {
      const parts = account.username.split('@');
      setUsername(parts[0] || '');
      setEmailDomain(parts[1] || ssoDomains[0] || 'finansia.com');
    }

    setIsFormOpen(true);
  };

  const openDeleteConfirm = (account: Account) => {
    setAccountToDelete(account);
    setIsConfirmDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!username.trim() || !name.trim() || (!editingAccount && hasAdminAuthority(role) && !password)) {
      setFormError(ADMIN_ACCOUNTS_TEXT.REQUIRED_FIELDS_ERROR);
      setIsSubmitting(false);
      return;
    }

    const targetUsername = hasAdminAuthority(role) && !emailDomain
      ? username.trim()
      : `${username.trim()}@${emailDomain.trim()}`;

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

  const handleDelete = async () => {
    if (!accountToDelete) return;
    await deleteAccount(accountToDelete.id);
    setAccountToDelete(null);
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

  return (
    <div id={ADMIN_ACCOUNTS_SEMANTIC_ID.CONTAINER} className="w-full space-y-6">
      {/* Header */}
      <div id={ADMIN_ACCOUNTS_SEMANTIC_ID.HEADER} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            {ADMIN_ACCOUNTS_TEXT.TITLE}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {ADMIN_ACCOUNTS_TEXT.SUBTITLE}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id={ADMIN_ACCOUNTS_SEMANTIC_ID.REFRESH_BTN}
            onClick={refresh}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
          </button>
          <button
            id={ADMIN_ACCOUNTS_SEMANTIC_ID.ADD_BTN}
            onClick={openAddModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {ADMIN_ACCOUNTS_TEXT.ADD_ACCOUNT}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {!loading && accounts.length > 0 && (
        <AccountsSearchFilter
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          rolesList={ROLES_LIST}
        />
      )}

      {/* Main content */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/50 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{ADMIN_ACCOUNTS_TEXT.LOADING_ACCOUNTS}</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-950 dark:text-white text-sm">{ADMIN_ACCOUNTS_TEXT.NO_ACCOUNTS_TITLE}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            {ADMIN_ACCOUNTS_TEXT.NO_ACCOUNTS_DESC}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            {ADMIN_ACCOUNTS_TEXT.CREATE_FIRST_BTN}
          </button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-950 dark:text-white text-sm">{ADMIN_ACCOUNTS_TEXT.NO_RESULTS_TITLE}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            No accounts match "{searchQuery}" {roleFilter !== 'All' ? `with role ${roleFilter}` : ''}.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('All');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            {ADMIN_ACCOUNTS_TEXT.RESET_FILTERS}
          </button>
        </div>
      ) : (
        <div id={ADMIN_ACCOUNTS_SEMANTIC_ID.LIST_CONTAINER} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAccounts.map((account) => (
            <AccountListItem
              key={account.id}
              account={account}
              onEdit={openEditModal}
              onDelete={openDeleteConfirm}
            />
          ))}
        </div>
      )}

      {/* CRUD dialog */}
      <AccountFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingAccount={editingAccount}
        username={username}
        onUsernameChange={setUsername}
        emailDomain={emailDomain}
        onEmailDomainChange={setEmailDomain}
        password={password}
        onPasswordChange={setPassword}
        name={name}
        onNameChange={setName}
        role={role}
        onRoleChange={setRole}
        formError={formError}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        ssoDomains={ssoDomains}
        rolesList={ROLES_LIST}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title={ADMIN_ACCOUNTS_TEXT.DELETE_CONFIRM_TITLE}
        description={`Are you sure you want to delete account for ${accountToDelete?.name || ''} (@${accountToDelete?.username || ''})? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default AccountsAdminView;
