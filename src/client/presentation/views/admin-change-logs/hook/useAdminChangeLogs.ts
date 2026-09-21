'use client';

import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';

import { useState, useEffect, useMemo } from 'react';
import { Project } from '@/src/client/domain/project/entity/project';
import { ChangeLog } from '@/src/client/domain/change-log/entity/change_log';
import { CHANGE_LOGS_ADMIN_TEXT } from '../constant';

export type ChangeLogEntry = ChangeLog;

export function useAdminChangeLogs() {
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLogDetails, setActiveLogDetails] = useState<ChangeLogEntry | null>(null);

  // UseCases
  const changeLogUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.changeLogUseCase), []);
  const projectUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.projectUseCase), []);

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
      setError(err?.message || CHANGE_LOGS_ADMIN_TEXT.ERROR_LOAD_LOGS);
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