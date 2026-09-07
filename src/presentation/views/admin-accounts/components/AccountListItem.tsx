'use client';

import React from 'react';
import { Shield, User, Edit2, Trash2 } from 'lucide-react';
import { Account } from '@/src/domain/account/entity/account';
import { hasAdminAuthority } from '@/src/core/constants/roles';
import { ADMIN_ACCOUNTS_TEXT, ADMIN_ACCOUNTS_SEMANTIC_ID } from '../constant';

interface AccountListItemProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export const AccountListItem: React.FC<AccountListItemProps> = ({
  account,
  onEdit,
  onDelete,
}) => {
  const isSystemAdmin = account.username === 'admin';
  return (
    <div
      id={ADMIN_ACCOUNTS_SEMANTIC_ID.CARD_ITEM}
      className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-xl flex items-start justify-between gap-4 shadow-xs hover:border-indigo-500/30 transition-all"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          {hasAdminAuthority(account.role) ? (
            <Shield className="w-5 h-5" />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
            {account.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
            @{account.username}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md">
              {account.role}
            </span>
            {account.googleId && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md flex items-center gap-1">
                <span>Google ID: {account.googleId}</span>
              </span>
            )}
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
              {ADMIN_ACCOUNTS_TEXT.JOINED_PREFIX} {new Date(account.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 shrink-0">
        <button
          id={ADMIN_ACCOUNTS_SEMANTIC_ID.CARD_EDIT_BTN}
          onClick={() => onEdit(account)}
          className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
          title="Edit User"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          id={ADMIN_ACCOUNTS_SEMANTIC_ID.CARD_DELETE_BTN}
          onClick={() => onDelete(account)}
          disabled={isSystemAdmin}
          className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          title="Delete User"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
