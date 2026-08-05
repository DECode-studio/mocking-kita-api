'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface ApiCollectionHeaderProps {
  totalCount: number;
  activeProjectId?: string;
  onAddClick: () => void;
}

export const ApiCollectionHeader: React.FC<ApiCollectionHeaderProps> = ({
  totalCount,
  activeProjectId,
  onAddClick,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          API Collections & Endpoints
        </h2>
        <p className="text-xs text-slate-500">
          Define mock endpoint contracts and route parameters ({totalCount} total)
        </p>
      </div>

      <button
        type="button"
        onClick={onAddClick}
        disabled={!activeProjectId}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" />
        Add API Collection
      </button>
    </div>
  );
};
