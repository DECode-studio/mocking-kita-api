'use client';


import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/src/core/utils/cn';
import { CHANGE_LOGS_ADMIN_TEXT, CHANGE_LOGS_ADMIN_SEMANTIC_ID } from '../constant';

interface ChangeLogsAdminHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export const ChangeLogsAdminHeader: React.FC<ChangeLogsAdminHeaderProps> = ({
  loading,
  onRefresh,
}) => {
  return (
    <div
      id={CHANGE_LOGS_ADMIN_SEMANTIC_ID.HEADER}
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {CHANGE_LOGS_ADMIN_TEXT.TITLE}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {CHANGE_LOGS_ADMIN_TEXT.SUBTITLE}
        </p>
      </div>
      <button
        id={CHANGE_LOGS_ADMIN_SEMANTIC_ID.REFRESH_BTN}
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg hover:shadow-sm transition-all disabled:opacity-50"
      >
        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        {CHANGE_LOGS_ADMIN_TEXT.REFRESH_BTN}
      </button>
    </div>
  );
};