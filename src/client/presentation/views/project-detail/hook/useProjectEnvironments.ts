import { useState, useEffect, useCallback, useMemo } from 'react';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { EnvironmentType } from '@/src/core/utils/types';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { getErrorMessage } from '@/src/core/utils/error';

export function useProjectEnvironments(projectId: string) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [projectList, setProjectList] = useState<{ id: string; name: string }[]>([]);

  const addToast = useUIStore((state) => state.addToast);
  const environmentUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.environmentUseCase), []);
  const projectUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.projectUseCase), []);

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

  return {
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
    refresh: loadEnvironments,
  };
}
