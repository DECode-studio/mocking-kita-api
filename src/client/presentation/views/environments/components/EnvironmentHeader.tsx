'use client';

import React from 'react';
import { Plus, Search, Server, Filter, X, KeyRound, Globe, Layers } from 'lucide-react';
import { Project } from '@/src/client/domain/project/entity/project';
import { EnvironmentType } from '@/src/core/utils/types';
import { ENVIRONMENTS_TEXT, ENVIRONMENTS_SEMANTIC_ID } from '../constant';

export type CategoryFilterType = 'ALL' | EnvironmentType;
export type ViewModeType = 'env' | 'variable';

interface EnvironmentHeaderProps {
  // Search
  searchInputValue: string;
  onSearchInputChange: (value: string) => void;
  onClearSearch: () => void;
  // Project
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  projects: Project[];
  // View Mode
  viewMode: ViewModeType;
  onViewModeChange: (mode: ViewModeType) => void;
  // Category
  selectedCategory: CategoryFilterType;
  onCategoryChange: (cat: CategoryFilterType) => void;
  categoryCounts: Record<CategoryFilterType, number>;
  totalVariablesCount: number;
  // Create
  onCreateClick: () => void;
}

const CATEGORY_TABS: { key: CategoryFilterType; label: string; fullLabel: string }[] = [
  { key: 'ALL', label: 'All', fullLabel: 'All Stages' },
  { key: 'LOCAL', label: 'Local Mock', fullLabel: 'Local Mock Proxy' },
  { key: 'DEVELOPMENT', label: 'Dev', fullLabel: 'Development' },
  { key: 'TESTING', label: 'Test', fullLabel: 'Testing' },
  { key: 'STAGING', label: 'Stg', fullLabel: 'Staging' },
  { key: 'PRODUCTION', label: 'Prod', fullLabel: 'Production' },
];

export const EnvironmentHeader: React.FC<EnvironmentHeaderProps> = ({
  searchInputValue,
  onSearchInputChange,
  onClearSearch,
  selectedProjectId,
  onProjectChange,
  projects,
  viewMode,
  onViewModeChange,
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  totalVariablesCount,
  onCreateClick,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Header: Title & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h1
                id={ENVIRONMENTS_SEMANTIC_ID.PAGE_TITLE}
                className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                {ENVIRONMENTS_TEXT.TITLE}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {ENVIRONMENTS_TEXT.SUBTITLE}
              </p>
            </div>
          </div>
        </div>

        {/* Top Right Action: Create Button */}
        <div className="flex items-center gap-3">
          <button
            id={ENVIRONMENTS_SEMANTIC_ID.CREATE_BTN}
            onClick={onCreateClick}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{ENVIRONMENTS_TEXT.CREATE_BUTTON}</span>
          </button>
        </div>
      </div>

      {/* Row 2: View Mode Switcher + Search & Project Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-1">
        {/* View Mode Switcher */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-750 self-start">
          <button
            id={ENVIRONMENTS_SEMANTIC_ID.VIEW_MODE_ENV}
            type="button"
            onClick={() => onViewModeChange('env')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'env'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>{ENVIRONMENTS_TEXT.VIEW_MODE_ENV}</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {categoryCounts.ALL}
            </span>
          </button>

          <button
            id={ENVIRONMENTS_SEMANTIC_ID.VIEW_MODE_VAR}
            type="button"
            onClick={() => onViewModeChange('variable')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'variable'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>{ENVIRONMENTS_TEXT.VIEW_MODE_VARIABLE}</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {totalVariablesCount}
            </span>
          </button>
        </div>

        {/* Right Side: Search & Project Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-56 flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id={ENVIRONMENTS_SEMANTIC_ID.SEARCH_INPUT}
              type="text"
              value={searchInputValue}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder={
                viewMode === 'env'
                  ? ENVIRONMENTS_TEXT.SEARCH_PLACEHOLDER
                  : 'Search variables by key, env, or project...'
              }
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-colors"
            />
            {searchInputValue && (
              <button
                id={ENVIRONMENTS_SEMANTIC_ID.SEARCH_CLEAR_BTN}
                onClick={onClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project Dropdown */}
          <div className="relative min-w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              id={ENVIRONMENTS_SEMANTIC_ID.PROJECT_FILTER}
              value={selectedProjectId}
              onChange={(e) => onProjectChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 appearance-none cursor-pointer transition-colors"
            >
              <option value="ALL">{ENVIRONMENTS_TEXT.ALL_PROJECTS}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Row 3: Category Env Filter Tabs (Prominent Bar) */}
      {viewMode === 'env' && (
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Category:</span>
          </div>

          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.key;
            const count = categoryCounts[tab.key] || 0;

            return (
              <button
                key={tab.key}
                id={ENVIRONMENTS_SEMANTIC_ID.CATEGORY_TAB(tab.key)}
                type="button"
                onClick={() => onCategoryChange(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs border border-indigo-200 dark:border-indigo-800/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
                title={tab.fullLabel}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
