'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Environment, EnvironmentVariable } from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { EnvironmentType } from '@/src/core/utils/types';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { ENVIRONMENTS_TEXT } from '../constant/environmentsText';
import { getErrorMessage } from '@/src/core/utils/error';

export interface EnvironmentFormData {
  name: string;
  projectId: string;
  isBaseUrl?: boolean;
  values?: import('@/src/client/domain/environment/entity/environment').EnvironmentValuesMap;
  environmentType?: EnvironmentType;
  variables: EnvironmentVariable[];
  baseUrl?: string;
  status: boolean;
}

export function useEnvironments() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const addToast = useUIStore((state) => state.addToast);

  const environmentUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.environmentUseCase), []);
  const projectUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.projectUseCase), []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [envsData, projectsData] = await Promise.all([
        environmentUseCase.getAll(),
        projectUseCase.getAll(),
      ]);
      setEnvironments(envsData);
      setProjects(projectsData);
    } catch (err) {
      addToast({ title: getErrorMessage(err, 'Failed to load environments data'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [environmentUseCase, projectUseCase, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Project map for quick lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Filtered environments
  const filteredEnvironments = useMemo(() => {
    return environments.filter((env) => {
      const matchesProject = selectedProjectId === 'ALL' || env.projectId === selectedProjectId;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        env.name.toLowerCase().includes(q) ||
        (env.environmentType && env.environmentType.toLowerCase().includes(q)) ||
        (Array.isArray(env.variables) &&
          env.variables.some(
            (v) =>
              v.key.toLowerCase().includes(q) ||
              (v.type !== 'secret' && v.value.toLowerCase().includes(q))
          )) ||
        (env.values &&
          Object.values(env.values).some(
            (val) => typeof val === 'string' && val.toLowerCase().includes(q)
          ));
      return matchesProject && matchesSearch;
    });
  }, [environments, selectedProjectId, searchQuery]);

  const handleOpenCreateModal = () => {
    setEditingEnvironment(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (env: Environment) => {
    setEditingEnvironment(env);
    setIsFormOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormOpen(false);
    setEditingEnvironment(null);
  };

  const handleSaveEnvironment = async (data: EnvironmentFormData) => {
    try {
      if (editingEnvironment) {
        const updated = await environmentUseCase.update(editingEnvironment.id, {
          name: data.name,
          projectId: data.projectId,
          isBaseUrl: data.isBaseUrl,
          values: data.values,
          environmentType: data.environmentType,
          variables: data.variables,
          baseUrl: data.baseUrl,
          status: data.status,
        });
        setEnvironments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        addToast({ title: ENVIRONMENTS_TEXT.TOAST.UPDATE_SUCCESS, type: 'success' });
      } else {
        const created = await environmentUseCase.create({
          name: data.name,
          projectId: data.projectId,
          isBaseUrl: data.isBaseUrl,
          values: data.values,
          environmentType: data.environmentType,
          variables: data.variables,
          baseUrl: data.baseUrl,
          status: data.status,
        });
        setEnvironments((prev) => [created, ...prev]);
        addToast({ title: ENVIRONMENTS_TEXT.TOAST.CREATE_SUCCESS, type: 'success' });
      }
      handleCloseFormModal();
    } catch (err) {
      addToast({ title: getErrorMessage(err, 'Failed to save environment'), type: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await environmentUseCase.softDelete(deleteTargetId);
      setEnvironments((prev) => prev.filter((e) => e.id !== deleteTargetId));
      addToast({ title: ENVIRONMENTS_TEXT.TOAST.DELETE_SUCCESS, type: 'success' });
    } catch (err) {
      addToast({ title: getErrorMessage(err, 'Failed to delete environment'), type: 'error' });
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleToggleStatus = async (env: Environment) => {
    try {
      const updated = await environmentUseCase.update(env.id, { status: !env.status });
      setEnvironments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      addToast({ title: getErrorMessage(err, 'Failed to update status'), type: 'error' });
    }
  };

  return {
    environments: filteredEnvironments,
    allEnvironmentsCount: environments.length,
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
    refresh: loadData,
  };
}
