'use client';


import React from 'react';
import { cn } from '@/src/core/utils/cn';
import { ChangeLogEntry } from '../hook/useAdminChangeLogs';

interface ChangeLogActionBadgeProps {
  action: ChangeLogEntry['action'];
}

export const ChangeLogActionBadge: React.FC<ChangeLogActionBadgeProps> = ({ action }) => {
  const styles: Record<ChangeLogEntry['action'], string> = {
    CREATE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
    UPDATE: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
    DELETE: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
    RESTORE: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20',
    IMPORT: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20',
    EXPORT: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-500/20',
    RESET: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset',
        styles[action] || 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20'
      )}
    >
      {action}
    </span>
  );
};