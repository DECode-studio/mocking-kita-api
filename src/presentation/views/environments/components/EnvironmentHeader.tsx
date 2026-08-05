'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { ENVIRONMENTS_TEXT, ENVIRONMENTS_SEMANTIC_ID } from '../constant';

interface EnvironmentHeaderProps {
  totalCount: number;
  activeProjectId?: string;
  onAddClick: () => void;
}

export const EnvironmentHeader: React.FC<EnvironmentHeaderProps> = ({
  totalCount,
  activeProjectId,
  onAddClick,
}) => {
  return (
    <div id={ENVIRONMENTS_SEMANTIC_ID.HEADER} className="flex items-center justify-between">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {ENVIRONMENTS_TEXT.TITLE}
        </h2>
        <p className="text-xs text-slate-500">
          {ENVIRONMENTS_TEXT.SUBTITLE} ({totalCount} total)
        </p>
      </div>

      <button
        id={ENVIRONMENTS_SEMANTIC_ID.ADD_ENV_BTN}
        type="button"
        onClick={onAddClick}
        disabled={!activeProjectId}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {ENVIRONMENTS_TEXT.ADD_ENV_BTN}
      </button>
    </div>
  );
};
