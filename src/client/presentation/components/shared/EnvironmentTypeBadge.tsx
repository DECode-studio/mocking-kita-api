import React from 'react';
import { EnvironmentType } from '@/src/core/utils/types';

interface EnvironmentTypeBadgeProps {
  type: EnvironmentType | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const EnvironmentTypeBadge: React.FC<EnvironmentTypeBadgeProps> = ({
  type,
  size = 'md',
  className = '',
}) => {
  const normalized = (type || 'LOCAL').toUpperCase();

  const getStyle = (t: string) => {
    switch (t) {
      case 'LOCAL':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'DEVELOPMENT':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'TESTING':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'STAGING':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'PRODUCTION':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center justify-center font-mono rounded-md border backdrop-blur-sm ${sizeClasses} ${getStyle(
        normalized
      )} ${className}`}
    >
      {normalized}
    </span>
  );
};
