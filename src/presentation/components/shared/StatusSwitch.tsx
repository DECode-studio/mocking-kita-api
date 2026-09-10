'use client';

import React from 'react';
import * as Switch from '@radix-ui/react-switch';
import { cn } from '../../../core/utils/cn';

interface StatusSwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  label?: string;
}

export const StatusSwitch: React.FC<StatusSwitchProps> = ({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  size = 'md',
  className,
  label,
}) => {
  const sizeClasses = size === 'sm' ? 'w-8 h-4.5' : 'w-10 h-5.5';
  const thumbSize = size === 'sm' ? 'w-3.5 h-3.5 translate-x-0.5' : 'w-4.5 h-4.5 translate-x-0.5';
  const thumbChecked = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          sizeClasses,
          checked ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
        )}
      >
        <Switch.Thumb
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-sm transform ring-0 transition duration-200 ease-in-out my-auto',
            thumbSize,
            checked ? thumbChecked : 'translate-x-0.5'
          )}
        />
      </Switch.Root>
      {label && (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
    </div>
  );
};
