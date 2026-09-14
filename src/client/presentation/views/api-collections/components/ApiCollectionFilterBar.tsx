'use client';


import React from 'react';
import { Search } from 'lucide-react';
import { API_COLLECTIONS_TEXT, API_COLLECTIONS_SEMANTIC_ID } from '../constant';

interface ApiCollectionFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  methodFilter: string;
  onMethodFilterChange: (method: string) => void;
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  onStatusFilterChange: (status: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
}

export const ApiCollectionFilterBar: React.FC<ApiCollectionFilterBarProps> = ({
  search,
  onSearchChange,
  methodFilter,
  onMethodFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div id={API_COLLECTIONS_SEMANTIC_ID.FILTER_BAR} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="relative flex-1">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={API_COLLECTIONS_SEMANTIC_ID.SEARCH_INPUT}
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={API_COLLECTIONS_TEXT.SEARCH_PLACEHOLDER}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={methodFilter}
          onChange={(e) => onMethodFilterChange(e.target.value)}
          className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
        >
          <option value="ALL">{API_COLLECTIONS_TEXT.ALL_METHODS}</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
          className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
        >
          <option value="ALL">{API_COLLECTIONS_TEXT.ALL_STATUS}</option>
          <option value="ACTIVE">{API_COLLECTIONS_TEXT.ACTIVE}</option>
          <option value="INACTIVE">{API_COLLECTIONS_TEXT.DISABLED}</option>
        </select>
      </div>
    </div>
  );
};