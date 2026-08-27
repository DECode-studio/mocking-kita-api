'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Edit2, Key, AlertCircle, X } from 'lucide-react';
import { Account } from '@/src/domain/account/entity/account';
import { hasAdminAuthority, ADMIN_ACCOUNT_ROLES } from '@/src/core/constants/roles';
import { ADMIN_ACCOUNTS_TEXT, ADMIN_ACCOUNTS_SEMANTIC_ID } from '../constant';

interface AccountFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount: Account | null;
  username: string;
  onUsernameChange: (val: string) => void;
  emailDomain: string;
  onEmailDomainChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  name: string;
  onNameChange: (val: string) => void;
  role: string;
  onRoleChange: (val: string) => void;
  formError: string | null;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  ssoDomains: string[];
  rolesList: string[];
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onOpenChange,
  editingAccount,
  username,
  onUsernameChange,
  emailDomain,
  onEmailDomainChange,
  password,
  onPasswordChange,
  name,
  onNameChange,
  role,
  onRoleChange,
  formError,
  isSubmitting,
  onSubmit,
  ssoDomains,
  rolesList,
}) => {
  const isAdmin = hasAdminAuthority(role);
  const isEmailAccount = Boolean(emailDomain) || (editingAccount ? editingAccount.username.includes('@') : !isAdmin);
  const availableDomains = Array.from(
    new Set([
      ...ssoDomains,
      ...(emailDomain ? [emailDomain] : []),
    ])
  ).filter(Boolean);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          id={ADMIN_ACCOUNTS_SEMANTIC_ID.DIALOG_CONTENT}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none animate-in zoom-in-95 duration-200"
        >
          <div className="flex justify-between items-start">
            <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {editingAccount ? (
                <>
                  <Edit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {ADMIN_ACCOUNTS_TEXT.EDIT_ACCOUNT}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {ADMIN_ACCOUNTS_TEXT.ADD_USER_ACCOUNT}
                </>
              )}
            </Dialog.Title>
            <button
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 pt-2">
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {isEmailAccount ? ADMIN_ACCOUNTS_TEXT.LABEL_EMAIL_SSO : ADMIN_ACCOUNTS_TEXT.LABEL_USERNAME}
              </label>
              {isEmailAccount ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder={ADMIN_ACCOUNTS_TEXT.PLACEHOLDER_SSO_USERNAME}
                    value={username}
                    onChange={(e) => onUsernameChange(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <span className="text-slate-400 font-mono text-sm shrink-0">@</span>
                  <select
                    value={emailDomain}
                    onChange={(e) => onEmailDomainChange(e.target.value)}
                    className="w-44 text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shrink-0 cursor-pointer"
                  >
                    {availableDomains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  required
                  placeholder={ADMIN_ACCOUNTS_TEXT.PLACEHOLDER_ADMIN_USERNAME}
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {ADMIN_ACCOUNTS_TEXT.LABEL_DISPLAY_NAME}
              </label>
              <input
                type="text"
                required
                placeholder={ADMIN_ACCOUNTS_TEXT.PLACEHOLDER_DISPLAY_NAME}
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            {/* Password (only for Admin authority roles) */}
            {isAdmin ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {ADMIN_ACCOUNTS_TEXT.LABEL_PASSWORD} {editingAccount ? ADMIN_ACCOUNTS_TEXT.LABEL_OPTIONAL : ADMIN_ACCOUNTS_TEXT.LABEL_REQUIRED}
                </label>
                <div className="relative flex items-center">
                  <Key className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder={editingAccount ? ADMIN_ACCOUNTS_TEXT.PLACEHOLDER_PASSWORD_EDIT : ADMIN_ACCOUNTS_TEXT.PLACEHOLDER_PASSWORD_NEW}
                    required={!editingAccount}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-xl text-[11px] leading-relaxed border border-indigo-100/50 dark:border-indigo-900/30">
                {ADMIN_ACCOUNTS_TEXT.SSO_INFO_HINT}
              </div>
            )}

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {ADMIN_ACCOUNTS_TEXT.LABEL_ACCOUNT_ROLE}
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  onRoleChange(newRole);
                  if (!emailDomain && availableDomains.length > 0) {
                    onEmailDomainChange(availableDomains[0]);
                  }
                }}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
              >
                {ADMIN_ACCOUNT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                {ADMIN_ACCOUNTS_TEXT.CANCEL}
              </button>
              <button
                id={ADMIN_ACCOUNTS_SEMANTIC_ID.DIALOG_SUBMIT_BTN}
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? ADMIN_ACCOUNTS_TEXT.SAVING : ADMIN_ACCOUNTS_TEXT.SAVE_ACCOUNT}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
