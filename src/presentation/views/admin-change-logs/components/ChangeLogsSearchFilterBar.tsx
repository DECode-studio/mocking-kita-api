'use client';

import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Project } from '@/src/domain/project/entity/project';
import { CHANGE_LOGS_ADMIN_TEXT, CHANGE_LOGS_ADMIN_SEMANTIC_ID } from '../constant';

interface ChangeLogsSearchFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  actionFilter: string;
  onActionFilterChange: (val: string) => void;
  projectFilter: string;
  onProjectFilterChange: (val: string) => void;
  projects: Project[];
}

export const ChangeLogsSearchFilterBar: React.FC<ChangeLogsSearchFilterBarProps> = ({
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  projectFilter,
  onProjectFilterChange,
  projects,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
      <div className="relative md:col-span-2">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4.5 w-4.5 text-slate-400" />
        </span>
        <input
          id={CHANGE_LOGS_ADMIN_SEMANTIC_ID.SEARCH_INPUT}
          type="text"
          placeholder={CHANGE_LOGS_ADMIN_TEXT.SEARCH_PLACEHOLDER}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition"
        />
      </div>

      {/* Action Filter */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Filter className="h-4 w-4 text-slate-400" />
        </span>
        <select
          id={CHANGE_LOGS_ADMIN_SEMANTIC_ID.ACTION_FILTER}
          value={actionFilter}
          onChange={(e) => onActionFilterChange(e.target.value)}
          className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition appearance-none cursor-pointer"
        >
          <option value="">{CHANGE_LOGS_ADMIN_TEXT.ALL_ACTIONS}</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="RESTORE">RESTORE</option>
          <option value="IMPORT">IMPORT</option>
          <option value="RESET">RESET</option>
        </select>
      </div>

      {/* Project Filter */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Filter className="h-4 w-4 text-slate-400" />
        </span>
        <select
          id={CHANGE_LOGS_ADMIN_SEMANTIC_ID.PROJECT_FILTER}
          value={projectFilter}
          onChange={(e) => onProjectFilterChange(e.target.value)}
          className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition appearance-none cursor-pointer"
        >
          <option value="">{CHANGE_LOGS_ADMIN_TEXT.ALL_PROJECTS}</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
