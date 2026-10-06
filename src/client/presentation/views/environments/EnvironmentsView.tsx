'use client';

import React from 'react';
import { useEnvironments } from './hook/useEnvironments';
import {
  EnvironmentHeader,
  EnvironmentsTableView,
  VariablesTableView,
  EnvironmentPagination,
  EnvironmentFormModal,
} from './components';
import { ConfirmDialog } from '@/src/client/presentation/components/shared/ConfirmDialog';
import { ScrollToTopButton } from '@/src/client/presentation/components/shared/ScrollToTopButton';
import { ENVIRONMENTS_TEXT, ENVIRONMENTS_SEMANTIC_ID } from './constant';

export const EnvironmentsView: React.FC = () => {
  const {
    environments,
    variables,
    totalVariablesCount,
    projects,
    projectMap,
    isLoading,
    // Search
    searchInputValue,
    handleSearchInputChange,
    handleClearSearch,
    // Filter & Mode
    selectedProjectId,
    handleSelectProject,
    selectedCategory,
    handleSelectCategory,
    categoryCounts,
    viewMode,
    handleSelectViewMode,
    // Pagination
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    handlePageChange,
    // Modals
    isFormOpen,
    editingEnvironment,
    deleteTargetId,
    setDeleteTargetId,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseFormModal,
    handleSaveEnvironment,
    handleConfirmDelete,
    handleToggleStatus,
  } = useEnvironments();

  return (
    <div id={ENVIRONMENTS_SEMANTIC_ID.CONTAINER} className="w-full space-y-6">
      {/* Header */}
      <EnvironmentHeader
        searchInputValue={searchInputValue}
        onSearchInputChange={handleSearchInputChange}
        onClearSearch={handleClearSearch}
        selectedProjectId={selectedProjectId}
        onProjectChange={handleSelectProject}
        projects={projects}
        viewMode={viewMode}
        onViewModeChange={handleSelectViewMode}
        selectedCategory={selectedCategory}
        onCategoryChange={handleSelectCategory}
        categoryCounts={categoryCounts}
        totalVariablesCount={totalVariablesCount}
        onCreateClick={handleOpenCreateModal}
      />

      {/* Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full"
            />
          ))}
        </div>
      ) : viewMode === 'env' ? (
        <div className="space-y-4">
          <EnvironmentsTableView
            environments={environments}
            projectMap={projectMap}
            selectedCategory={selectedCategory}
            onEdit={handleOpenEditModal}
            onDelete={(id) => setDeleteTargetId(id)}
            onToggleStatus={handleToggleStatus}
            onCreateClick={handleOpenCreateModal}
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
        <div className="space-y-4">
          <VariablesTableView
            variables={variables}
            onEditEnvironment={handleOpenEditModal}
            onCreateClick={handleOpenCreateModal}
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
        onClose={handleCloseFormModal}
        onSave={handleSaveEnvironment}
        editingEnvironment={editingEnvironment}
        projects={projects}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title={ENVIRONMENTS_TEXT.DELETE_CONFIRM_TITLE}
        description={ENVIRONMENTS_TEXT.DELETE_CONFIRM_MESSAGE}
        confirmLabel={ENVIRONMENTS_TEXT.DELETE_CONFIRM_BTN}
        variant="danger"
      />

      {/* Scroll to Top */}
      <ScrollToTopButton />
    </div>
  );
};
