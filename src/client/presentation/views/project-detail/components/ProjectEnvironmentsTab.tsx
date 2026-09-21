import React, { useState, useMemo } from 'react';
import { Plus, Server, Globe, KeyRound } from 'lucide-react';
import { EnvironmentFormModal } from '@/src/client/presentation/views/environments/components/EnvironmentFormModal';
import { EnvironmentCard } from '@/src/client/presentation/views/environments/components/EnvironmentCard';
import { ConfirmDialog } from '@/src/client/presentation/components/shared/ConfirmDialog';
import { EmptyState } from '@/src/client/presentation/components/shared/EmptyState';
import { useProjectEnvironments } from '../hook/useProjectEnvironments';

interface ProjectEnvironmentsTabProps {
  projectId: string;
}

type FilterCategory = 'ALL' | 'BASE_URL' | 'VARIABLES';

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

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');

  const filteredEnvironments = useMemo(() => {
    if (activeFilter === 'BASE_URL') {
      return environments.filter((e) => e.isBaseUrl !== false);
    }
    if (activeFilter === 'VARIABLES') {
      return environments.filter((e) => e.isBaseUrl === false);
    }
    return environments;
  }, [environments, activeFilter]);

  const serviceCount = environments.filter((e) => e.isBaseUrl !== false).length;
  const variableCount = environments.filter((e) => e.isBaseUrl === false).length;

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Project Environments
          </h3>
          <p className="text-xs text-slate-500">
            Multi-stage service matrix (Base URLs) and shared environment variables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          {environments.length > 0 && (
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({environments.length})
              </button>
              <button
                onClick={() => setActiveFilter('BASE_URL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'BASE_URL'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3 h-3" />
                Services ({serviceCount})
              </button>
              <button
                onClick={() => setActiveFilter('VARIABLES')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'VARIABLES'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <KeyRound className="w-3 h-3" />
                Variables ({variableCount})
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setEditingEnvironment(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Environment</span>
          </button>
        </div>
      </div>

      {/* Grid or Empty */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      ) : environments.length === 0 ? (
        <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
          <EmptyState
            icon={Server}
            title="No Environments Configured"
            description="Create an environment or import from OpenAPI spec to configure target stages."
            actionLabel="Add Environment"
            onAction={() => {
              setEditingEnvironment(null);
              setIsFormOpen(true);
            }}
          />
        </div>
      ) : filteredEnvironments.length === 0 ? (
        <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500">
          No environments match the selected category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEnvironments.map((env) => (
            <EnvironmentCard
              key={env.id}
              environment={env}
              onEdit={(e) => {
                setEditingEnvironment(e);
                setIsFormOpen(true);
              }}
              onDelete={(id) => setDeleteTargetId(id)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
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
