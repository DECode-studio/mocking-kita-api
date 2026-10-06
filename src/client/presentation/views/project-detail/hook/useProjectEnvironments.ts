'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Environment, ALL_ENVIRONMENT_TYPES } from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { EnvironmentType } from '@/src/core/utils/types';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { getErrorMessage } from '@/src/core/utils/error';
import { EnvironmentFormData } from '@/src/client/presentation/views/environments/hook/useEnvironments';
import { CategoryFilterType, ViewModeType } from '@/src/client/presentation/views/environments/components/EnvironmentHeader';
import { FlattenedVariableItem } from '@/src/client/presentation/views/environments/components/VariablesTableView';

const PAGE_SIZE = 10;

export function useProjectEnvironments(projectId: string) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter, Mode & Pagination
  const [viewMode, setViewMode] = useState<ViewModeType>('env');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterType>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Search Debounce State
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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
      setProjectList(projects);
    } catch (err) {
      addToast({ title: getErrorMessage(err, 'Failed to load project environments'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, environmentUseCase, projectUseCase, addToast]);

  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  // Project Map for lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projectList.forEach((p) => map.set(p.id, p));
    return map;
  }, [projectList]);

  // Search debounce handler
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInputValue(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInputValue('');
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilterType, number> = {
      ALL: environments.length,
      LOCAL: 0,
      DEVELOPMENT: 0,
      TESTING: 0,
      STAGING: 0,
      PRODUCTION: 0,
    };

    environments.forEach((env) => {
      const isBaseUrl = env.isBaseUrl !== false;
      const values = env.values || {};

      if (isBaseUrl || (values.LOCAL !== undefined && values.LOCAL !== null) || env.environmentType === 'LOCAL') {
        counts.LOCAL++;
      }
      if ((values.DEVELOPMENT && String(values.DEVELOPMENT).trim().length > 0) || env.environmentType === 'DEVELOPMENT') {
        counts.DEVELOPMENT++;
      }
      if ((values.TESTING && String(values.TESTING).trim().length > 0) || env.environmentType === 'TESTING') {
        counts.TESTING++;
      }
      if ((values.STAGING && String(values.STAGING).trim().length > 0) || env.environmentType === 'STAGING') {
        counts.STAGING++;
      }
      if ((values.PRODUCTION && String(values.PRODUCTION).trim().length > 0) || env.environmentType === 'PRODUCTION') {
        counts.PRODUCTION++;
      }
    });

    return counts;
  }, [environments]);

  // Flattened Variables (environments with isBaseUrl === false)
  const allVariables = useMemo(() => {
    const list: FlattenedVariableItem[] = [];
    const project = projectMap.get(projectId);

    environments.forEach((env) => {
      // If isBaseUrl is false, the environment itself is the variable
      if (env.isBaseUrl === false) {
        list.push({
          id: env.id,
          key: env.name,
          type: 'plain',
          enabled: env.status,
          description: '',
          envId: env.id,
          envName: env.name,
          envIsBaseUrl: false,
          projectId: env.projectId,
          projectName: project ? project.name : '',
          environment: env,
        });
      }
    });

    return list;
  }, [environments, projectId, projectMap]);

  // Filtered Environments
  const filteredEnvironments = useMemo(() => {
    return environments.filter((env) => {
      // Category check
      if (selectedCategory !== 'ALL') {
        const isBaseUrl = env.isBaseUrl !== false;
        const values = env.values || {};

        if (selectedCategory === 'LOCAL') {
          const hasLocal = isBaseUrl || (values.LOCAL !== undefined && values.LOCAL !== null) || env.environmentType === 'LOCAL';
          if (!hasLocal) return false;
        } else {
          const hasStage =
            (values[selectedCategory] !== undefined &&
              values[selectedCategory] !== null &&
              String(values[selectedCategory]).trim().length > 0) ||
            env.environmentType === selectedCategory;
          if (!hasStage) return false;
        }
      }

      // Search check
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchesName = env.name.toLowerCase().includes(q);
      const matchesEnvType = env.environmentType && env.environmentType.toLowerCase().includes(q);
      const matchesVars =
        Array.isArray(env.variables) &&
        env.variables.some((v) => v.key.toLowerCase().includes(q));
      const matchesValues =
        env.values &&
        Object.values(env.values).some(
          (val) => typeof val === 'string' && val.toLowerCase().includes(q)
        );

      return matchesName || matchesEnvType || matchesVars || matchesValues;
    });
  }, [environments, selectedCategory, searchQuery]);

  // Filtered Variables
  const filteredVariables = useMemo(() => {
    return allVariables.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        item.key.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.envName.toLowerCase().includes(q)
      );
    });
  }, [allVariables, searchQuery]);

  // Pagination calculation
  const totalItems = viewMode === 'env' ? filteredEnvironments.length : filteredVariables.length;
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);
  const activePage = Math.min(currentPage, totalPages);

  const paginatedEnvironments = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredEnvironments.slice(start, start + PAGE_SIZE);
  }, [filteredEnvironments, activePage]);

  const paginatedVariables = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredVariables.slice(start, start + PAGE_SIZE);
  }, [filteredVariables, activePage]);

  // Handler methods
  const handleSelectCategory = (cat: CategoryFilterType) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSelectViewMode = (mode: ViewModeType) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

  const handleSaveEnvironment = async (data: EnvironmentFormData) => {
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
    environments: paginatedEnvironments,
    allFilteredEnvironmentsCount: filteredEnvironments.length,
    variables: paginatedVariables,
    allFilteredVariablesCount: filteredVariables.length,
    totalVariablesCount: allVariables.length,
    projectList,
    projectMap,
    isLoading,
    // Search
    searchInputValue,
    handleSearchInputChange,
    handleClearSearch,
    // View & Category
    viewMode,
    handleSelectViewMode,
    selectedCategory,
    handleSelectCategory,
    categoryCounts,
    // Pagination
    currentPage: activePage,
    totalPages,
    totalItems,
    pageSize: PAGE_SIZE,
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
    refresh: loadEnvironments,
  };
}
