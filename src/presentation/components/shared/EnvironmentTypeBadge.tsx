'use client';

import React from 'react';
import { EnvironmentType } from '../../../core/utils/types';
import { cn } from '../../../core/utils/cn';

interface EnvironmentTypeBadgeProps {
  type: EnvironmentType;
  className?: string;
}

export const EnvironmentTypeBadge: React.FC<EnvironmentTypeBadgeProps> = ({ type, className }) => {
  const badgeMap: Record<EnvironmentType, { bg: string; text: string; label: string }> = {
    LOCAL: {
      bg: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      text: 'LOCAL',
      label: 'Local',
    },
    DEVELOPMENT: {
      bg: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30',
      text: 'DEV',
      label: 'Development',
    },
    STAGING: {
      bg: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
      text: 'STAGE',
      label: 'Staging',
    },
    PRODUCTION: {
      bg: 'bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-500/30',
      text: 'PROD',
      label: 'Production',
    },
  };

  const current = badgeMap[type] || badgeMap.LOCAL;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium font-mono border',
        current.bg,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {current.label}
    </span>
  );
};
