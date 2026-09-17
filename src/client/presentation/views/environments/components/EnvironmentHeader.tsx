import React from 'react';
import { Plus, Search, Server, Filter } from 'lucide-react';
import { Project } from '@/src/client/domain/project/entity/project';
import { ENVIRONMENTS_TEXT, ENVIRONMENTS_SEMANTIC_ID } from '../constant';

interface EnvironmentHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  projects: Project[];
  onCreateClick: () => void;
}

export const EnvironmentHeader: React.FC<EnvironmentHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedProjectId,
  onProjectChange,
  projects,
  onCreateClick,
}) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <div className="flex items-center gap-2">
          <Server className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
          <h1
            id={ENVIRONMENTS_SEMANTIC_ID.PAGE_TITLE}
            className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            {ENVIRONMENTS_TEXT.TITLE}
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {ENVIRONMENTS_TEXT.SUBTITLE}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id={ENVIRONMENTS_SEMANTIC_ID.SEARCH_INPUT}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={ENVIRONMENTS_TEXT.SEARCH_PLACEHOLDER}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200 transition-colors"
          />
        </div>

        {/* Project Filter */}
        <div className="relative min-w-45">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            id={ENVIRONMENTS_SEMANTIC_ID.PROJECT_FILTER}
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200 appearance-none cursor-pointer transition-colors"
          >
            <option value="ALL">{ENVIRONMENTS_TEXT.ALL_PROJECTS}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Create Button */}
        <button
          id={ENVIRONMENTS_SEMANTIC_ID.CREATE_BTN}
          onClick={onCreateClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{ENVIRONMENTS_TEXT.CREATE_BUTTON}</span>
        </button>
      </div>
    </div>
  );
};
