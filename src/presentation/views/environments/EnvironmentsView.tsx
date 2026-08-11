'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import {  createEnvironmentUseCase  } from '@/src/di/usecase_provider';
import { useEnvironments } from './useEnvironments';
import { ENVIRONMENTS_TEXT, ENVIRONMENTS_SEMANTIC_ID } from './constant';
import {
  EnvironmentHeader,
  EnvironmentCard,
  EnvironmentFormModal,
} from './components';

interface EnvironmentsViewProps {
  embeddedProjectId?: string;
  initialEnvironments?: import('@/src/domain/environment/entity/environment').Environment[];
  initialProject?: import('@/src/domain/project/entity/project').Project | null;
}

export const EnvironmentsView: React.FC<EnvironmentsViewProps> = ({
  embeddedProjectId,
  initialEnvironments = [],
  initialProject = null,
}) => {
  const environmentUseCase = createEnvironmentUseCase();
  const {
    activeProjectId,
    environments,
    form,
    isFormOpen,
    setIsFormOpen,
    editingEnv,
    deletingEnvId,
    setDeletingEnvId,
    copiedField,
    openAddDialog,
    openEditDialog,
    onSubmitForm,
    handleCopyUrl,
    handleDelete,
    toggleEnvironmentStatus,
  } = useEnvironments(environmentUseCase, embeddedProjectId, initialEnvironments, initialProject);

  return (
    <div id={ENVIRONMENTS_SEMANTIC_ID.CONTAINER} className="space-y-4">
      {/* Header */}
      <EnvironmentHeader
        totalCount={environments.length}
        activeProjectId={activeProjectId}
        onAddClick={openAddDialog}
      />

      {/* Environment Cards List */}
      {environments.length === 0 ? (
        <EmptyState
          icon={Globe}
          title={ENVIRONMENTS_TEXT.EMPTY_TITLE}
          description={ENVIRONMENTS_TEXT.EMPTY_DESC}
          actionLabel={ENVIRONMENTS_TEXT.ADD_ENV_BTN}
          onAction={openAddDialog}
        />
      ) : (
        <div id={ENVIRONMENTS_SEMANTIC_ID.ENV_GRID} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {environments.map((env) => (
            <EnvironmentCard
              key={env.id}
              env={env}
              copiedField={copiedField}
              onToggleStatus={toggleEnvironmentStatus}
              onEdit={openEditDialog}
              onDeleteRequest={(id) => setDeletingEnvId(id)}
              onCopyUrl={handleCopyUrl}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <EnvironmentFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingEnv={editingEnv}
        form={form}
        onSubmit={onSubmitForm}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingEnvId}
        onClose={() => setDeletingEnvId(null)}
        onConfirm={handleDelete}
        title={ENVIRONMENTS_TEXT.DELETE_DIALOG_TITLE}
        description={ENVIRONMENTS_TEXT.DELETE_DIALOG_DESC}
        confirmLabel={ENVIRONMENTS_TEXT.DELETE_DIALOG_CONFIRM}
        variant="danger"
      />
    </div>
  );
};

export default EnvironmentsView;
