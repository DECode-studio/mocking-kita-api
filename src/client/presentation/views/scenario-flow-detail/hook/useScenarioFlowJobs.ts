'use client';

import { useState, useEffect, useCallback } from 'react';
import { getService } from '@/src/core/di/container';
import { CLIENT_DI_TOKENS } from '@/src/core/di/tokens';
import { ScenarioFlowJob } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';

export function useScenarioFlowJobs(flowId?: string, projectId?: string) {
  const flowUseCase = getService(CLIENT_DI_TOKENS.scenarioFlowUseCase);
  const dataSheetUseCase = getService(CLIENT_DI_TOKENS.dataSheetUseCase);

  const [jobs, setJobs] = useState<ScenarioFlowJob[]>([]);
  const [dataSheets, setDataSheets] = useState<DataSheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ScenarioFlowJob | null>(null);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await flowUseCase.getJobs(flowId, projectId);
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to load scenario flow jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [flowUseCase, flowId, projectId]);

  const loadDataSheets = useCallback(async () => {
    try {
      const sheets = await dataSheetUseCase.getByProjectId(projectId);
      setDataSheets(sheets || []);
    } catch (err) {
      console.error('Failed to load data sheets for job picker:', err);
    }
  }, [dataSheetUseCase, projectId]);

  useEffect(() => {
    loadJobs();
    loadDataSheets();
  }, [loadJobs, loadDataSheets]);

  // Polling / auto-refresh when active jobs exist (every 10s)
  useEffect(() => {
    const hasActiveJobs = jobs.some((j) => j.status === 'ACTIVE');
    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      loadJobs();
    }, 10000);

    return () => clearInterval(interval);
  }, [jobs, loadJobs]);

  const handleCreateJob = async (input: any) => {
    try {
      const payload = {
        ...input,
        flowId: input.flowId || flowId,
        projectId: projectId || null,
      };
      await flowUseCase.createJob(payload);
      await loadJobs();
      setIsModalOpen(false);
      setEditingJob(null);
    } catch (err) {
      console.error('Failed to create job:', err);
      throw err;
    }
  };

  const handleUpdateJob = async (jobId: string, input: any) => {
    try {
      await flowUseCase.updateJob(jobId, input);
      await loadJobs();
      setIsModalOpen(false);
      setEditingJob(null);
    } catch (err) {
      console.error('Failed to update job:', err);
      throw err;
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled job?')) {
      return;
    }
    try {
      await flowUseCase.deleteJob(jobId);
      await loadJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Failed to delete job');
    }
  };

  const handleToggleStatus = async (jobId: string) => {
    try {
      await flowUseCase.toggleJobStatus(jobId);
      await loadJobs();
    } catch (err) {
      console.error('Failed to toggle job status:', err);
      alert('Failed to toggle job status');
    }
  };

  const handleRunNow = async (jobId: string) => {
    try {
      setRunningJobId(jobId);
      await flowUseCase.runNowJob(jobId);
      await loadJobs();
    } catch (err) {
      console.error('Failed to run job now:', err);
      alert('Failed to trigger job execution');
    } finally {
      setRunningJobId(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (filterStatus === 'ALL') return true;
    return job.status === filterStatus;
  });

  return {
    jobs: filteredJobs,
    allJobsCount: jobs.length,
    dataSheets,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    editingJob,
    setEditingJob,
    runningJobId,
    filterStatus,
    setFilterStatus,
    loadJobs,
    handleCreateJob,
    handleUpdateJob,
    handleDeleteJob,
    handleToggleStatus,
    handleRunNow,
  };
}
