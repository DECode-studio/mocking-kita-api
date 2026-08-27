'use client';

import { useState, useEffect, useMemo } from 'react';
import { createProjectUseCase, createChangeLogUseCase } from '@/src/di/usecase_provider';
import { Project } from '@/src/domain/project/entity/project';
import { ChangeLog } from '@/src/domain/change-log/entity/change_log';

export type ChangeLogEntry = ChangeLog;

export function useAdminChangeLogs() {
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLogDetails, setActiveLogDetails] = useState<ChangeLogEntry | null>(null);

  // UseCases
  const changeLogUseCase = useMemo(() => createChangeLogUseCase(), []);
  const projectUseCase = useMemo(() => createProjectUseCase(), []);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Debounce search query (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [actionFilter, projectFilter]);

  // Load projects list for the dropdown filter
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const allProjects = await projectUseCase.getAll();
        setProjects(allProjects);
      } catch (err) {
        console.error('Failed to load projects for change logs filter:', err);
      }
    };
    void loadProjects();
  }, [projectUseCase]);

  // Fetch change logs
  const fetchChangeLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * limit;
      const res = await changeLogUseCase.getChangeLogs({
        search: debouncedSearch || undefined,
        action: actionFilter || undefined,
        projectId: projectFilter || undefined,
        limit,
        offset,
      });
      setChangeLogs(res.changeLogs);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      setError(err?.message || 'Failed to load change logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchChangeLogs();
  }, [debouncedSearch, actionFilter, projectFilter, page]);

  const totalPages = Math.ceil(totalCount / limit);

  const openLogDetails = (log: ChangeLogEntry) => {
    setActiveLogDetails(log);
  };

  const closeLogDetails = () => {
    setActiveLogDetails(null);
  };

  return {
    changeLogs,
    projects,
    totalCount,
    loading,
    error,
    search,
    setSearch,
    actionFilter,
    setActionFilter,
    projectFilter,
    setProjectFilter,
    page,
    setPage,
    totalPages,
    activeLogDetails,
    openLogDetails,
    closeLogDetails,
    refresh: fetchChangeLogs,
  };
}
