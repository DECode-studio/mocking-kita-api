'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Environment,
  EnvironmentVariable,
  ALL_ENVIRONMENT_TYPES,
} from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { EnvironmentType } from '@/src/core/utils/types';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { ENVIRONMENTS_TEXT } from '../constant/environmentsText';
import { getErrorMessage } from '@/src/core/utils/error';
import { CategoryFilterType, ViewModeType } from '../components/EnvironmentHeader';
import { FlattenedVariableItem } from '../components/VariablesTableView';

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

const PAGE_SIZE = 10;

function parseCategoryParam(val: string | null): CategoryFilterType {
  if (!val) return 'ALL';
  const normalized = val.toUpperCase();
  if (normalized === 'LOCAL') return 'LOCAL';
  if (normalized === 'DEV' || normalized === 'DEVELOPMENT') return 'DEVELOPMENT';
  if (normalized === 'TEST' || normalized === 'TESTING') return 'TESTING';
  if (normalized === 'STG' || normalized === 'STAGING') return 'STAGING';
  if (normalized === 'PROD' || normalized === 'PRODUCTION') return 'PRODUCTION';
  return 'ALL';
}

function categoryToParam(cat: CategoryFilterType): string {
  switch (cat) {
    case 'LOCAL':
      return 'local';
    case 'DEVELOPMENT':
      return 'dev';
    case 'TESTING':
      return 'test';
    case 'STAGING':
      return 'stg';
    case 'PRODUCTION':
      return 'prod';
    default:
      return 'all';
  }
}

export function useEnvironments() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial URL params
  const urlSearch = searchParams?.get('search') || '';
  const urlProjectId = searchParams?.get('projectId') || 'ALL';
  const urlCategory = parseCategoryParam(searchParams?.get('category'));
  const urlView = (searchParams?.get('view') === 'variable' ? 'variable' : 'env') as ViewModeType;
  const urlPage = Math.max(parseInt(searchParams?.get('page') || '1', 10) || 1, 1);

  // Core Data State
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Filter / View States
  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterType>(urlCategory);
  const [viewMode, setViewMode] = useState<ViewModeType>(urlView);
  const [currentPage, setCurrentPage] = useState<number>(urlPage);

  // Debounced Search Input State
  const [searchInputValue, setSearchInputValue] = useState<string>(urlSearch);
  const [searchQuery, setSearchQuery] = useState<string>(urlSearch);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const addToast = useUIStore((state) => state.addToast);

  const environmentUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.environmentUseCase), []);
  const projectUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.projectUseCase), []);

  // Update URL function
  const updateUrl = useCallback(
    (updates: {
      search?: string;
      projectId?: string;
      category?: CategoryFilterType;
      view?: ViewModeType;
      page?: number;
    }) => {
      const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '');

      const newSearch = updates.search !== undefined ? updates.search : searchQuery;
      const newProjectId = updates.projectId !== undefined ? updates.projectId : selectedProjectId;
      const newCategory = updates.category !== undefined ? updates.category : selectedCategory;
      const newView = updates.view !== undefined ? updates.view : viewMode;
      const newPage = updates.page !== undefined ? updates.page : currentPage;

      if (newSearch) currentParams.set('search', newSearch);
      else currentParams.delete('search');

      if (newProjectId && newProjectId !== 'ALL') currentParams.set('projectId', newProjectId);
      else currentParams.delete('projectId');

      if (newCategory && newCategory !== 'ALL') currentParams.set('category', categoryToParam(newCategory));
      else currentParams.delete('category');

      if (newView && newView !== 'env') currentParams.set('view', newView);
      else currentParams.delete('view');

      if (newPage && newPage > 1) currentParams.set('page', String(newPage));
      else currentParams.delete('page');

      const queryString = currentParams.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [router, pathname, searchParams, searchQuery, selectedProjectId, selectedCategory, viewMode, currentPage]
  );

  // Search Debounce handler (300ms)
  const handleSearchInputChange = useCallback(
    (value: string) => {
      setSearchInputValue(value);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setSearchQuery(value);
        setCurrentPage(1);
        updateUrl({ search: value, page: 1 });
      }, 300);
    },
    [updateUrl]
  );

  const handleClearSearch = useCallback(() => {
    setSearchInputValue('');
    setSearchQuery('');
    setCurrentPage(1);
    updateUrl({ search: '', page: 1 });
  }, [updateUrl]);

  // Sync state if URL searchParams change externally
  useEffect(() => {
    if (urlSearch !== searchQuery) {
      setSearchInputValue(urlSearch);
      setSearchQuery(urlSearch);
    }
    if (urlProjectId !== selectedProjectId) {
      setSelectedProjectId(urlProjectId);
    }
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
    if (urlView !== viewMode) {
      setViewMode(urlView);
    }
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, urlProjectId, urlCategory, urlView, urlPage]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Fetch initial data
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

  // Category counts (for badges on tabs)
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilterType, number> = {
      ALL: 0,
      LOCAL: 0,
      DEVELOPMENT: 0,
      TESTING: 0,
      STAGING: 0,
      PRODUCTION: 0,
    };

    environments.forEach((env) => {
      const matchesProject = selectedProjectId === 'ALL' || env.projectId === selectedProjectId;
      if (!matchesProject) return;

      counts.ALL++;

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
  }, [environments, selectedProjectId]);

  // Flattened Variables across all environments (environments with isBaseUrl === false)
  const allVariables = useMemo(() => {
    const list: FlattenedVariableItem[] = [];

    environments.forEach((env) => {
      // If isBaseUrl is false, the environment itself is the variable
      if (env.isBaseUrl === false) {
        const project = projectMap.get(env.projectId);
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
  }, [environments, projectMap]);

  // Filtered environments (view as env)
  const filteredEnvironments = useMemo(() => {
    return environments.filter((env) => {
      const matchesProject = selectedProjectId === 'ALL' || env.projectId === selectedProjectId;
      if (!matchesProject) return false;

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

      // Search Query check
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const project = projectMap.get(env.projectId);
      const matchesName = env.name.toLowerCase().includes(q);
      const matchesProjectName = project && project.name.toLowerCase().includes(q);
      const matchesEnvType = env.environmentType && env.environmentType.toLowerCase().includes(q);
      const matchesVars =
        Array.isArray(env.variables) &&
        env.variables.some((v) => v.key.toLowerCase().includes(q));
      const matchesValues =
        env.values &&
        Object.values(env.values).some(
          (val) => typeof val === 'string' && val.toLowerCase().includes(q)
        );

      return matchesName || matchesProjectName || matchesEnvType || matchesVars || matchesValues;
    });
  }, [environments, selectedProjectId, selectedCategory, searchQuery, projectMap]);

  // Filtered variables (view as variable)
  const filteredVariables = useMemo(() => {
    return allVariables.filter((item) => {
      const matchesProject = selectedProjectId === 'ALL' || item.projectId === selectedProjectId;
      if (!matchesProject) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        item.key.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.envName.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q)
      );
    });
  }, [allVariables, selectedProjectId, searchQuery]);

  // Pagination Slices
  const totalItems = viewMode === 'env' ? filteredEnvironments.length : filteredVariables.length;
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);

  // Ensure current page does not exceed totalPages
  const activePage = Math.min(currentPage, totalPages);

  const paginatedEnvironments = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredEnvironments.slice(start, start + PAGE_SIZE);
  }, [filteredEnvironments, activePage]);

  const paginatedVariables = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredVariables.slice(start, start + PAGE_SIZE);
  }, [filteredVariables, activePage]);

  // Action Handlers
  const handleSelectCategory = (cat: CategoryFilterType) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    updateUrl({ category: cat, page: 1 });
  };

  const handleSelectViewMode = (mode: ViewModeType) => {
    setViewMode(mode);
    setCurrentPage(1);
    updateUrl({ view: mode, page: 1 });
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage(1);
    updateUrl({ projectId, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page });
  };

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
    environments: paginatedEnvironments,
    allFilteredEnvironmentsCount: filteredEnvironments.length,
    variables: paginatedVariables,
    allFilteredVariablesCount: filteredVariables.length,
    totalVariablesCount: allVariables.length,
    projects,
    projectMap,
    isLoading,
    // Search
    searchQuery,
    setSearchQuery,
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
    currentPage: activePage,
    totalPages,
    totalItems,
    pageSize: PAGE_SIZE,
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
    refresh: loadData,
  };
}
