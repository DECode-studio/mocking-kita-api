'use client';


import React from 'react';
import { LucideIcon, FolderPlus } from 'lucide-react';
import { cn } from '@/src/core/utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderPlus,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden p-10 text-center border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/80 dark:bg-slate-900/60 flex flex-col items-center justify-center shadow-sm',
        className
      )}
    >
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-800 text-purple-400 dark:text-purple-300 flex items-center justify-center mb-4 border border-slate-700/50 shadow-md">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl shadow transition-all hover:scale-[1.02]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};