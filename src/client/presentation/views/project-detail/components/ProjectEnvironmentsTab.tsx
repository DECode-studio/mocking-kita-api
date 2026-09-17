import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Server, Globe } from 'lucide-react';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { EnvironmentType } from '@/src/core/utils/types';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { getErrorMessage } from '@/src/core/utils/error';
import { EnvironmentTypeBadge } from '@/src/client/presentation/components/shared/EnvironmentTypeBadge';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { EnvironmentFormModal } from '@/src/client/presentation/views/environments/components/EnvironmentFormModal';
import { ConfirmDialog } from '@/src/client/presentation/components/shared/ConfirmDialog';
import { EmptyState } from '@/src/client/presentation/components/shared/EmptyState';

interface ProjectEnvironmentsTabProps {
  projectId: string;
}

export const ProjectEnvironmentsTab: React.FC<ProjectEnvironmentsTabProps> = ({ projectId }) => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const addToast = useUIStore((state) => state.addToast);
  const environmentUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.environmentUseCase), []);
  const projectUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.projectUseCase), []);
  const [projectList, setProjectList] = useState<{ id: string; name: string }[]>([]);

  const loadEnvironments = useCallback(async () => {
    setIsLoading(true);
    try {
      const [envs, projects] = await Promise.all([
        environmentUseCase.getByProjectId(projectId),
        projectUseCase.getAll(),
      ]);
      setEnvironments(envs);
      setProjectList(projects.map((p) => ({ id: p.id, name: p.name })));
    } catch (err) {
      addToast({ title: getErrorMessage(err, 'Failed to load project environments'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, environmentUseCase, projectUseCase, addToast]);

  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  const handleToggleStatus = async (env: Environment) => {
    try {
      const updated = await environmentUseCase.update(env.id, { status: !env.status });
      setEnvironments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      addToast({ title: getErrorMessage(err, 'Failed to update status'), type: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await environmentUseCase.softDelete(deleteTargetId);
      setEnvironments((prev) => prev.filter((e) => e.id !== deleteTargetId));
      addToast({ title: 'Environment deleted successfully', type: 'success' });
    } catch (err) {
      addToast({ title: getErrorMessage(err, 'Failed to delete environment'), type: 'error' });
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleSaveEnvironment = async (data: {
    name: string;
    projectId: string;
    environmentType: EnvironmentType;
    baseUrl: string;
    status: boolean;
  }) => {
    try {
      if (editingEnvironment) {
        const updated = await environmentUseCase.update(editingEnvironment.id, data);
        setEnvironments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        addToast({ title: 'Environment updated successfully', type: 'success' });
      } else {
        const created = await environmentUseCase.create(data);
        setEnvironments((prev) => [created, ...prev]);
        addToast({ title: 'Environment created successfully', type: 'success' });
      }
      setIsFormOpen(false);
      setEditingEnvironment(null);
    } catch (err) {
      addToast({ title: getErrorMessage(err, 'Failed to save environment'), type: 'error' });
    }
  };

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
