'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { API_COLLECTIONS_TEXT, API_COLLECTIONS_SEMANTIC_ID } from '../constant';

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
    <div id={API_COLLECTIONS_SEMANTIC_ID.HEADER} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {API_COLLECTIONS_TEXT.TITLE}
        </h2>
        <p className="text-xs text-slate-500">
          {API_COLLECTIONS_TEXT.SUBTITLE} ({totalCount} total)
        </p>
      </div>

      <button
        id={API_COLLECTIONS_SEMANTIC_ID.ADD_BTN}
        type="button"
        onClick={onAddClick}
        disabled={!activeProjectId}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" />
        {API_COLLECTIONS_TEXT.ADD_COLLECTION_BTN}
      </button>
    </div>
  );
};
