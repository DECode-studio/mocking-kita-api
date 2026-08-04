'use client';

import React from 'react';
import { cn } from '../../../core/utils/cn';

interface StatusBadgeProps {
  status: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border select-none',
        status
          ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
          : 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          status ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
        )}
      />
      {status ? activeLabel : inactiveLabel}
    </span>
  );
};
