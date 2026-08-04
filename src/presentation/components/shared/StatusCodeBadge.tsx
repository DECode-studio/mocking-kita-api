'use client';

import React from 'react';
import { cn } from '../../../core/utils/cn';

interface StatusCodeBadgeProps {
  code: number;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusCodeBadge: React.FC<StatusCodeBadgeProps> = ({ code, className, size = 'md' }) => {
  let styleClass = 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30';

  if (code >= 200 && code < 300) {
    styleClass = 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
  } else if (code >= 300 && code < 400) {
    styleClass = 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30';
  } else if (code >= 400 && code < 500) {
    styleClass = 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
  } else if (code >= 500) {
    styleClass = 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30';
  }

  const statusTextMap: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  const label = statusTextMap[code] ? `${code} ${statusTextMap[code]}` : `${code}`;

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-semibold rounded border',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        styleClass,
        className
      )}
    >
      {label}
    </span>
  );
};
