'use client';


import React from 'react';
import { MethodRequest } from '@/src/core/utils/types';
import { cn } from '@/src/core/utils/cn';

interface HttpMethodBadgeProps {
  method: MethodRequest;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const HttpMethodBadge: React.FC<HttpMethodBadgeProps> = ({
  method,
  size = 'md',
  className,
}) => {
  const methodUpper = (method || 'GET').toUpperCase() as MethodRequest;

  const colorMap: Record<MethodRequest, { bg: string; text: string; border: string }> = {
    GET: {
      bg: 'bg-emerald-100 dark:bg-emerald-500/15',
      text: 'text-emerald-800 dark:text-emerald-400 font-bold',
      border: 'border-emerald-300 dark:border-emerald-500/30',
    },
    POST: {
      bg: 'bg-indigo-100 dark:bg-indigo-500/15',
      text: 'text-indigo-800 dark:text-indigo-400 font-bold',
      border: 'border-indigo-300 dark:border-indigo-500/30',
    },
    PUT: {
      bg: 'bg-amber-100 dark:bg-amber-500/15',
      text: 'text-amber-800 dark:text-amber-400 font-bold',
      border: 'border-amber-300 dark:border-amber-500/30',
    },
    PATCH: {
      bg: 'bg-yellow-100 dark:bg-yellow-500/15',
      text: 'text-yellow-800 dark:text-yellow-400 font-bold',
      border: 'border-yellow-300 dark:border-yellow-500/30',
    },
    DELETE: {
      bg: 'bg-rose-100 dark:bg-rose-500/15',
      text: 'text-rose-800 dark:text-rose-400 font-bold',
      border: 'border-rose-300 dark:border-rose-500/30',
    },
    OPTIONS: {
      bg: 'bg-purple-100 dark:bg-purple-500/15',
      text: 'text-purple-800 dark:text-purple-400 font-bold',
      border: 'border-purple-300 dark:border-purple-500/30',
    },
    HEAD: {
      bg: 'bg-slate-200 dark:bg-slate-700/30',
      text: 'text-slate-800 dark:text-slate-300 font-bold',
      border: 'border-slate-300 dark:border-slate-600',
    },
  };

  const style = colorMap[methodUpper] || colorMap.GET;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] tracking-wide',
    md: 'px-2.5 py-1 text-xs tracking-wider',
    lg: 'px-3 py-1.5 text-sm tracking-wider',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono rounded border uppercase transition-colors select-none',
        style.bg,
        style.text,
        style.border,
        sizeClasses[size],
        className
      )}
    >
      {methodUpper}
    </span>
  );
};