import React from 'react';
import { Plus, Server, Globe } from 'lucide-react';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { EnvironmentTypeBadge } from '@/src/client/presentation/components/shared/EnvironmentTypeBadge';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { EnvironmentFormModal } from '@/src/client/presentation/views/environments/components/EnvironmentFormModal';
import { ConfirmDialog } from '@/src/client/presentation/components/shared/ConfirmDialog';
import { EmptyState } from '@/src/client/presentation/components/shared/EmptyState';
import { useProjectEnvironments } from '../hook/useProjectEnvironments';

interface ProjectEnvironmentsTabProps {
  projectId: string;
}

export const ProjectEnvironmentsTab: React.FC<ProjectEnvironmentsTabProps> = ({ projectId }) => {
  const {
    environments,
    isLoading,
    isFormOpen,
    setIsFormOpen,
    editingEnvironment,
    setEditingEnvironment,
    deleteTargetId,
    setDeleteTargetId,
    projectList,
    handleToggleStatus,
    handleConfirmDelete,
    handleSaveEnvironment,
  } = useProjectEnvironments(projectId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Project Environments
          </h3>
          <p className="text-xs text-slate-500">
            Configure server URLs and variables for this project.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEnvironment(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Environment</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      ) : environments.length === 0 ? (
        <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
          <EmptyState
            icon={Server}
            title="No Environments Configured"
            description="Create an environment or import from OpenAPI spec to get started."
            actionLabel="Add Environment"
            onAction={() => {
              setEditingEnvironment(null);
              setIsFormOpen(true);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {environments.map((env) => (
            <div
              key={env.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {env.name}
                    </span>
                    <EnvironmentTypeBadge type={env.environmentType} size="sm" />
                  </div>
                  <StatusSwitch checked={env.status} onCheckedChange={() => handleToggleStatus(env)} />
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                    {env.baseUrl || 'No base URL'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setEditingEnvironment(env);
                    setIsFormOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTargetId(env.id)}
                  className="px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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

      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Environment"
        description="Are you sure you want to delete this environment?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};
