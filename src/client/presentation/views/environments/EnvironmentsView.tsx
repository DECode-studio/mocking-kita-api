'use client';

import React from 'react';
import { Server } from 'lucide-react';
import { useEnvironments } from './hook/useEnvironments';
import { EnvironmentHeader, EnvironmentCard, EnvironmentFormModal } from './components';
import { ConfirmDialog } from '@/src/client/presentation/components/shared/ConfirmDialog';
import { EmptyState } from '@/src/client/presentation/components/shared/EmptyState';
import { ScrollToTopButton } from '@/src/client/presentation/components/shared/ScrollToTopButton';
import { ENVIRONMENTS_TEXT, ENVIRONMENTS_SEMANTIC_ID } from './constant';

export const EnvironmentsView: React.FC = () => {
  const {
    environments,
    projects,
    projectMap,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedProjectId,
    setSelectedProjectId,
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        projects={projects}
        onCreateClick={handleOpenCreateModal}
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-44 bg-gray-200 dark:bg-gray-800 rounded-xl"
            />
          ))}
        </div>
      ) : environments.length === 0 ? (
        <div id={ENVIRONMENTS_SEMANTIC_ID.EMPTY_STATE} className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-12 text-center">
          <EmptyState
            icon={Server}
            title={ENVIRONMENTS_TEXT.NO_ENVIRONMENTS}
            description={ENVIRONMENTS_TEXT.NO_ENVIRONMENTS_SUBTITLE}
            actionLabel={ENVIRONMENTS_TEXT.CREATE_BUTTON}
            onAction={handleOpenCreateModal}
          />
        </div>
      ) : (
        <div id={ENVIRONMENTS_SEMANTIC_ID.GRID} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {environments.map((env) => (
            <EnvironmentCard
              key={env.id}
              environment={env}
              project={projectMap.get(env.projectId)}
              onEdit={handleOpenEditModal}
              onDelete={(id) => setDeleteTargetId(id)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
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
