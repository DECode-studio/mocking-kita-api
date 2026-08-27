'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { ADMIN_ACCOUNT_ROLES } from '@/src/core/constants/roles';
import { ADMIN_ACCOUNTS_TEXT, ADMIN_ACCOUNTS_SEMANTIC_ID } from '../constant';

interface AccountsSearchFilterProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  roleFilter: string;
  onRoleFilterChange: (r: string) => void;
  rolesList: string[];
}

export const AccountsSearchFilter: React.FC<AccountsSearchFilterProps> = ({
  searchQuery,
  onSearchQueryChange,
  roleFilter,
  onRoleFilterChange,
  rolesList,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xs">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id={ADMIN_ACCOUNTS_SEMANTIC_ID.SEARCH_INPUT}
          type="text"
          placeholder={ADMIN_ACCOUNTS_TEXT.SEARCH_PLACEHOLDER}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full pl-10 pr-8 py-2.5 text-xs bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchQueryChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">{ADMIN_ACCOUNTS_TEXT.FILTER_ROLE_LABEL}</span>
        <select
          id={ADMIN_ACCOUNTS_SEMANTIC_ID.FILTER_SELECT}
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
        >
          <option value="All">{ADMIN_ACCOUNTS_TEXT.ALL_ROLES_OPTION}</option>
          {ADMIN_ACCOUNT_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
