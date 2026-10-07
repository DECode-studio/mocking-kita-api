'use client';

import React from 'react';
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Edit2,
  RotateCw,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Calendar,
  Layers,
  ArrowRight,
  Flame,
  Activity,
} from 'lucide-react';
import { ScenarioFlowJob } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { JobModal } from './JobModal';
import { useScenarioFlowJobs } from '../hook/useScenarioFlowJobs';
import { Environment } from '@/src/client/domain/environment/entity/environment';

interface FlowJobsTabProps {
  flowId?: string;
  flows?: Array<{ id: string; name: string }>;
  projectId?: string;
  environments: Environment[];
  onOpenHistory?: () => void;
}

export const FlowJobsTab: React.FC<FlowJobsTabProps> = ({
  flowId,
  flows = [],
  projectId,
  environments,
  onOpenHistory,
}) => {
  const {
    jobs,
    allJobsCount,
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
  } = useScenarioFlowJobs(flowId, projectId);

  const formatSchedule = (job: ScenarioFlowJob) => {
    if (job.scheduleType === 'CRON') {
      return `Cron: ${job.cronExpression}`;
    }
    if (job.scheduleType === 'INTERVAL') {
      const sec = job.intervalSeconds || 0;
      if (sec >= 3600) return `Every ${Math.round(sec / 3600)} hour(s)`;
      if (sec >= 60) return `Every ${Math.round(sec / 60)} min(s)`;
      return `Every ${sec} sec(s)`;
    }
    if (job.scheduleType === 'ONCE') {
      return job.scheduledAt
        ? `Once at ${new Date(job.scheduledAt).toLocaleString()}`
        : 'One-time run';
    }
    return job.scheduleType;
  };

  const formatNextRun = (dateStr?: string | null) => {
    if (!dateStr) return 'No upcoming run scheduled';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);

    if (diffSec <= 0) return 'Executing soon...';
    if (diffSec < 60) return `In ${diffSec}s (${date.toLocaleTimeString()})`;
    if (diffSec < 3600) return `In ${Math.round(diffSec / 60)}m (${date.toLocaleTimeString()})`;
    return `On ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Scheduled Automation Jobs</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-mono">
                {jobs.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automate scenario flow executions continuously, on intervals, or iterated over Data Sheets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setEditingJob(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && jobs.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-purple-500" />
          <span>Loading scheduled jobs...</span>
        </div>
      ) : jobs.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/40 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Scheduled Jobs Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create a job to run this flow periodically (e.g. every 5 minutes, daily) or iterate through rows in a Data Sheet automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingJob(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Job</span>
          </button>
        </div>
      ) : (
        /* Jobs List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const isJobRunning = runningJobId === job.id;
            const statusColor =
              job.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : job.status === 'PAUSED'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : job.status === 'COMPLETED'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';

            return (
              <div
                key={job.id}
                className="relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-purple-500/40 transition-all group"
              >
                {/* Header */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {job.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusColor}`}
                        >
                          {job.status === 'ACTIVE' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          {job.status}
                        </span>
                      </div>
                      {job.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>

                    {/* Quick Play/Pause & Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(job.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          job.status === 'ACTIVE'
                            ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={job.status === 'ACTIVE' ? 'Pause Job' : 'Resume / Activate Job'}
                      >
                        {job.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingJob(job);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Job"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete Job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Schedule & Environment Badges */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
                      <Clock className="w-3 h-3 text-purple-500" />
                      {formatSchedule(job)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium">
                      Mode: {job.targetMode}
                    </span>
                    {job.dataSourceType === 'DATASHEET' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium">
                        <Database className="w-3 h-3" />
                        {job.dataSheet?.name || 'DataSheet'} ({job.dataIterationMode === 'PER_TICK' ? '1 row/tick' : 'Batch all'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics & Next Run */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  {/* Next Run & Iteration */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      Next Run:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {job.status === 'ACTIVE' ? formatNextRun(job.nextRunAt) : 'Paused / Inactive'}
                    </span>
                  </div>

                  {/* Progress Stats */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Iteration</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        #{job.currentIteration}
                        {job.maxIterations ? `/${job.maxIterations}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Success</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {job.successRuns}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Failed</div>
                      <div className="text-xs font-bold text-red-500">
                        {job.failedRuns}
                      </div>
                    </div>
                  </div>

                  {/* Run Now Button */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-slate-400 truncate">
                      {job.lastRunAt ? `Last run: ${new Date(job.lastRunAt).toLocaleTimeString()}` : 'Never executed'}
                    </div>

                    <button
                      type="button"
                      disabled={isJobRunning}
                      onClick={() => handleRunNow(job.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/80 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isJobRunning ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Run Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <JobModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingJob(null);
        }}
        flowId={flowId}
        flows={flows}
        projectId={projectId}
        environments={environments}
        dataSheets={dataSheets}
        editingJob={editingJob}
        onSave={async (data) => {
          if (editingJob) {
            await handleUpdateJob(editingJob.id, data);
          } else {
            await handleCreateJob(data);
          }
        }}
      />
    </div>
  );
};
