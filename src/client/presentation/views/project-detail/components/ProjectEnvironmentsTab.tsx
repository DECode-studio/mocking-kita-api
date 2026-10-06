'use client';

import React from 'react';
import { Plus, Search, X, Globe, KeyRound, Layers } from 'lucide-react';
import { EnvironmentFormModal } from '@/src/client/presentation/views/environments/components/EnvironmentFormModal';
import { EnvironmentsTableView } from '@/src/client/presentation/views/environments/components/EnvironmentsTableView';
import { VariablesTableView } from '@/src/client/presentation/views/environments/components/VariablesTableView';
import { EnvironmentPagination } from '@/src/client/presentation/views/environments/components/EnvironmentPagination';
import { ConfirmDialog } from '@/src/client/presentation/components/shared/ConfirmDialog';
import { useProjectEnvironments } from '../hook/useProjectEnvironments';
import { CategoryFilterType } from '@/src/client/presentation/views/environments/components/EnvironmentHeader';

interface ProjectEnvironmentsTabProps {
  projectId: string;
}

const CATEGORY_TABS: { key: CategoryFilterType; label: string; fullLabel: string }[] = [
  { key: 'ALL', label: 'All', fullLabel: 'All Stages' },
  { key: 'LOCAL', label: 'Local Mock', fullLabel: 'Local Mock Proxy' },
  { key: 'DEVELOPMENT', label: 'Dev', fullLabel: 'Development' },
  { key: 'TESTING', label: 'Test', fullLabel: 'Testing' },
  { key: 'STAGING', label: 'Stg', fullLabel: 'Staging' },
  { key: 'PRODUCTION', label: 'Prod', fullLabel: 'Production' },
];

export const ProjectEnvironmentsTab: React.FC<ProjectEnvironmentsTabProps> = ({ projectId }) => {
  const {
    environments,
    variables,
    totalVariablesCount,
    projectList,
    projectMap,
    isLoading,
    // Search
    searchInputValue,
    handleSearchInputChange,
    handleClearSearch,
    // Filter & Mode
    viewMode,
    handleSelectViewMode,
    selectedCategory,
    handleSelectCategory,
    categoryCounts,
    // Pagination
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    handlePageChange,
    // Modals
    isFormOpen,
    setIsFormOpen,
    editingEnvironment,
    setEditingEnvironment,
    deleteTargetId,
    setDeleteTargetId,
    handleToggleStatus,
    handleConfirmDelete,
    handleSaveEnvironment,
  } = useProjectEnvironments(projectId);

  return (
    <div className="space-y-4">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Project Environments
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-stage service matrix (Base URLs) and shared environment variables for this project.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInputValue}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              placeholder={
                viewMode === 'env'
                  ? 'Search environments by name...'
                  : 'Search variables by key...'
              }
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-colors"
            />
            {searchInputValue && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add Environment Button */}
          <button
            onClick={() => {
              setEditingEnvironment(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Environment</span>
          </button>
        </div>
      </div>

      {/* Row 2: View Mode Switcher */}
      <div className="flex items-center gap-3">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-750 self-start">
          <button
            type="button"
            onClick={() => handleSelectViewMode('env')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'env'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>View as Env</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {categoryCounts.ALL}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectViewMode('variable')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'variable'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>View as Variable</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {totalVariablesCount}
            </span>
          </button>
        </div>
      </div>

      {/* Row 3: Category Filter Bar (Prominent for View as Env) */}
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
                type="button"
                onClick={() => handleSelectCategory(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
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

      {/* Table Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full" />
          ))}
        </div>
      ) : viewMode === 'env' ? (
        <div className="space-y-3">
          <EnvironmentsTableView
            environments={environments}
            projectMap={projectMap}
            selectedCategory={selectedCategory}
            onEdit={(e) => {
              setEditingEnvironment(e);
              setIsFormOpen(true);
            }}
            onDelete={(id) => setDeleteTargetId(id)}
            onToggleStatus={handleToggleStatus}
            onCreateClick={() => {
              setEditingEnvironment(null);
              setIsFormOpen(true);
            }}
          />

          <EnvironmentPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <VariablesTableView
            variables={variables}
            onEditEnvironment={(e) => {
              setEditingEnvironment(e);
              setIsFormOpen(true);
            }}
            onCreateClick={() => {
              setEditingEnvironment(null);
              setIsFormOpen(true);
            }}
          />

          <EnvironmentPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Form Modal */}
      <EnvironmentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEnvironment(null);
        }}
        onSave={handleSaveEnvironment}
        editingEnvironment={editingEnvironment}
        projects={projectList as any}
        defaultProjectId={projectId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Environment"
        description="Are you sure you want to delete this environment? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};
