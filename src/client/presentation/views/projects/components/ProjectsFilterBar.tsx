'use client';


import React from 'react';
import { Search, Grid, List as ListIcon } from 'lucide-react';
import { PROJECTS_TEXT, PROJECTS_SEMANTIC_ID } from '../constant';

interface ProjectsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'DELETED';
  onStatusFilterChange: (status: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'DELETED') => void;
  sortBy: 'name' | 'date';
  onSortByChange: (sort: 'name' | 'date') => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

export const ProjectsFilterBar: React.FC<ProjectsFilterBarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div id={PROJECTS_SEMANTIC_ID.FILTER_BAR} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={PROJECTS_SEMANTIC_ID.SEARCH_INPUT}
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={PROJECTS_TEXT.SEARCH_PLACEHOLDER}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium">
          {(['ALL', 'ACTIVE', 'INACTIVE', 'DELETED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value === 'name' ? 'name' : 'date')}
          className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
        >
          <option value="date">Sort: Created Date</option>
          <option value="name">Sort: Name</option>
        </select>

        <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-400'}`}
            title={PROJECTS_TEXT.VIEW_GRID}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`p-1 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-400'}`}
            title={PROJECTS_TEXT.VIEW_TABLE}
          >
            <ListIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};