'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { Project } from '@/src/client/domain/project/entity/project';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { getErrorMessage } from '@/src/core/utils/error';

export function useDataSheets(projectId?: string) {
  const [dataSheets, setDataSheets] = useState<DataSheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProjectId, setFilterProjectId] = useState<string>(projectId || 'ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<DataSheet | null>(null);

  const addToast = useUIStore((state) => state.addToast);

  const dataSheetUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.dataSheetUseCase), []);
  const projectUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.projectUseCase), []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sheets, projectList] = await Promise.all([
        projectId
          ? dataSheetUseCase.getByProjectId(projectId)
          : dataSheetUseCase.getAll(),
        projectUseCase.getAll(),
      ]);

      setDataSheets(sheets);
      setProjects(projectList.filter((p) => !p.deletedAt));
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to load data sheets'),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, dataSheetUseCase, projectUseCase, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSheets = useMemo(() => {
    return dataSheets.filter((sheet) => {
      // Filter by Project
      if (filterProjectId !== 'ALL') {
        if (filterProjectId === 'GLOBAL' && sheet.projectId !== null) return false;
        if (filterProjectId !== 'GLOBAL' && sheet.projectId !== filterProjectId) return false;
      }

      // Filter by Category
      if (filterCategory !== 'ALL') {
        if (!sheet.category || sheet.category.toLowerCase() !== filterCategory.toLowerCase()) {
          return false;
        }
      }

      // Filter by Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = sheet.name.toLowerCase().includes(query);
        const matchesCode = sheet.code.toLowerCase().includes(query);
        const matchesCategory = sheet.category?.toLowerCase().includes(query);
        const matchesDesc = sheet.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesCategory && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [dataSheets, filterProjectId, filterCategory, searchQuery]);

  const handleCreateOrUpdate = async (input: {
    id?: string;
    projectId?: string | null;
    name: string;
    code: string;
    category?: string | null;
    description?: string | null;
    format: 'LIST' | 'TABLE';
    data: any[];
    status?: boolean;
  }) => {
    try {
      if (input.id) {
        const updated = await dataSheetUseCase.update(input.id, input);
        setDataSheets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        addToast({
          title: `Data sheet '${updated.name}' updated successfully`,
          type: 'success',
        });
      } else {
        const created = await dataSheetUseCase.create(input);
        setDataSheets((prev) => [created, ...prev]);
        addToast({
          title: `Data sheet '${created.name}' created successfully`,
          type: 'success',
        });
      }
      setIsModalOpen(false);
      setEditingSheet(null);
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to save data sheet'),
        type: 'error',
      });
      throw err;
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete data sheet '${name}'?`)) return;
    try {
      await dataSheetUseCase.delete(id);
      setDataSheets((prev) => prev.filter((s) => s.id !== id));
      addToast({
        title: `Data sheet '${name}' deleted successfully`,
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to delete data sheet'),
        type: 'error',
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await dataSheetUseCase.toggleStatus(id);
      setDataSheets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      addToast({
        title: `Data sheet '${updated.name}' ${updated.status ? 'activated' : 'deactivated'}`,
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to update status'),
        type: 'error',
      });
    }
  };

  const openCreateModal = () => {
    setEditingSheet(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sheet: DataSheet) => {
    setEditingSheet(sheet);
    setIsModalOpen(true);
  };

  return {
    dataSheets: filteredSheets,
    allSheets: dataSheets,
    projects,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterProjectId,
    setFilterProjectId,
    filterCategory,
    setFilterCategory,
    isModalOpen,
    setIsModalOpen,
    editingSheet,
    openCreateModal,
    openEditModal,
    handleCreateOrUpdate,
    handleDelete,
    handleToggleStatus,
    refreshData: loadData,
  };
}
