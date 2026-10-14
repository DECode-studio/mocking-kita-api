'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getService } from '@/src/core/di/container';
import { CLIENT_DI_TOKENS } from '@/src/core/di/tokens';
import { ScenarioFlowExecution, ScenarioFlowJob } from '@/src/client/domain/scenario-flow/entity/scenario_flow';

interface UseJobExecutionLogsParams {
  flowId?: string;
  flows?: Array<{ id: string; name: string }>;
  projectId?: string;
  jobs?: ScenarioFlowJob[];
  initialJobId?: string;
}

export function useJobExecutionLogs({
  flowId,
  flows = [],
  projectId,
  jobs = [],
  initialJobId,
}: UseJobExecutionLogsParams) {
  const flowUseCase = getService(CLIENT_DI_TOKENS.scenarioFlowUseCase);

  const [executions, setExecutions] = useState<ScenarioFlowExecution[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedFlowId, setSelectedFlowId] = useState<string>(flowId || 'ALL');
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<ScenarioFlowExecution | null>(null);
  const [selectedInspectStep, setSelectedInspectStep] = useState<any | null>(null);

  // Synchronize when flowId changes
  useEffect(() => {
    if (flowId) {
      setSelectedFlowId(flowId);
    }
  }, [flowId]);

  // Synchronize when initialJobId changes
  useEffect(() => {
    if (initialJobId) {
      setSelectedJobId(initialJobId);
      setCurrentPage(1);
    }
  }, [initialJobId]);

  const effectiveFlowId = selectedFlowId !== 'ALL' ? selectedFlowId : flowId || undefined;

  const loadLogs = useCallback(
    async (pageToLoad = currentPage, sizeToLoad = pageSize) => {
      try {
        setIsLoading(true);
        const result = await flowUseCase.getJobExecutions({
          flowId: effectiveFlowId,
          projectId: projectId || undefined,
          jobId: selectedJobId && selectedJobId !== 'ALL' ? selectedJobId : undefined,
          status: statusFilter && statusFilter !== 'ALL' ? statusFilter : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: pageToLoad,
          limit: sizeToLoad,
        });

        if (result) {
          setExecutions(result.items || []);
          setTotalItems(result.total || 0);
          setTotalPages(result.totalPages || 1);
          setCurrentPage(result.page || pageToLoad);
        }
      } catch (err) {
        console.error('Failed to load job execution logs:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [flowUseCase, effectiveFlowId, projectId, selectedJobId, statusFilter, startDate, endDate, currentPage, pageSize]
  );

  useEffect(() => {
    loadLogs(currentPage, pageSize);
  }, [selectedFlowId, selectedJobId, statusFilter, startDate, endDate, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedFlowId(flowId || 'ALL');
    setSelectedJobId('ALL');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const triggerServerDownload = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        sp.set(key, val);
      }
    });

    const exportUrl = `/api/scenario-flows/jobs/executions/export?${sp.toString()}`;
    const link = document.createElement('a');
    link.href = exportUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (format: 'md' | 'csv', mode: 'filtered' | 'all') => {
    try {
      setIsExporting(true);
      const activeFlow = flows.find((f) => f.id === effectiveFlowId);
      const flowName = activeFlow?.name;

      triggerServerDownload({
        format,
        flowId: effectiveFlowId,
        projectId: projectId || undefined,
        flowName,
        ...(mode === 'filtered'
          ? {
              jobId: selectedJobId && selectedJobId !== 'ALL' ? selectedJobId : undefined,
              status: statusFilter && statusFilter !== 'ALL' ? statusFilter : undefined,
              startDate: startDate || undefined,
              endDate: endDate || undefined,
            }
          : {}),
      });
    } catch (err) {
      console.error('Failed to export job execution logs:', err);
      alert('Failed to trigger export download.');
    } finally {
      setIsExporting(false);
      setIsExportMenuOpen(false);
    }
  };

  const handleExportSingleSession = (executionId: string, format: 'md' | 'csv', flowName?: string) => {
    triggerServerDownload({
      format,
      executionId,
      flowName,
    });
  };

  const visibleJobs = useMemo(() => {
    return selectedFlowId && selectedFlowId !== 'ALL'
      ? jobs.filter((j) => j.flowId === selectedFlowId)
      : jobs;
  }, [jobs, selectedFlowId]);

  const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalItems);

  return {
    executions,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    startEntry,
    endEntry,
    visibleJobs,
    selectedFlowId,
    setSelectedFlowId,
    selectedJobId,
    setSelectedJobId,
    statusFilter,
    setStatusFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isLoading,
    isExporting,
    isExportMenuOpen,
    setIsExportMenuOpen,
    selectedExecution,
    setSelectedExecution,
    selectedInspectStep,
    setSelectedInspectStep,
    loadLogs,
    handlePageChange,
    handlePageSizeChange,
    handleResetFilters,
    handleExport,
    handleExportSingleSession,
  };
}
