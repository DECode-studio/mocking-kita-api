'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface DataSheetVariableTagBadgeProps {
  code: string;
  mode?: 'random' | 'index' | 'next' | 'asc' | 'desc' | 'dsc';
  index?: number;
  className?: string;
}

export const DataSheetVariableTagBadge: React.FC<DataSheetVariableTagBadgeProps> = ({
  code,
  mode = 'random',
  index = 0,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const tag =
    mode === 'random'
      ? `{{datasheet.${code}.random}}`
      : mode === 'asc' || mode === 'next'
      ? `{{datasheet.${code}.asc}}`
      : mode === 'desc' || mode === 'dsc'
      ? `{{datasheet.${code}.desc}}`
      : `{{datasheet.${code}[${index}]}}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy variable token"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-xs transition-colors bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 ${className}`}
    >
      <span>{tag}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
      )}
    </button>
  );
};
