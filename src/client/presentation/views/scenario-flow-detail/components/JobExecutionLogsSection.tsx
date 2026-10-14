'use client';

import React from 'react';
import {
  Clock,
  RotateCw,
  Filter,
  CheckCircle2,
  XCircle,
  FileDown,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  X,
  ExternalLink,
  Code,
  ShieldAlert,
} from 'lucide-react';
import {
  ScenarioFlowExecution,
  ScenarioFlowJob,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { formatDate } from '@/src/core/utils/date';
import { useJobExecutionLogs } from '../hook/useJobExecutionLogs';
import {
  SCENARIO_FLOW_DETAIL_TEXT,
  SCENARIO_FLOW_DETAIL_SEMANTIC_ID,
} from '../constant';

interface JobExecutionLogsSectionProps {
  flowId?: string;
  flows?: Array<{ id: string; name: string }>;
  projectId?: string;
  jobs: ScenarioFlowJob[];
  initialJobId?: string;
}

export const JobExecutionLogsSection: React.FC<JobExecutionLogsSectionProps> = ({
  flowId,
  flows = [],
  projectId,
  jobs,
  initialJobId,
}) => {
  const {
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
  } = useJobExecutionLogs({
    flowId,
    flows,
    projectId,
    jobs,
    initialJobId,
  });

  return (
    <div className="space-y-4">
      {/* Filters and Actions Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_TITLE}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-mono">
                {totalItems}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_SUBTITLE}
            </p>
          </div>

          {/* Action Buttons: Refresh & Export */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_BTN_REFRESH}
              onClick={() => loadLogs(currentPage, pageSize)}
              disabled={isLoading}
              title={SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_REFRESH}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_BTN_EXPORT}
                disabled={isExporting || totalItems === 0}
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_EXPORT_BTN}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {isExportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1.5 text-xs text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Export Current Filter / Range
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleExport('md', 'filtered');
                        }}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_EXPORT_FILTERED_MD}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleExport('csv', 'filtered');
                        }}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_EXPORT_FILTERED_CSV}</span>
                      </button>
                    </div>

                    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Export All History (Complete)
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleExport('md', 'all');
                        }}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_EXPORT_ALL_MD}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleExport('csv', 'all');
                        }}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_EXPORT_ALL_CSV}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Scenario Flow Filter (when in project-wide jobs view) */}
          {!flowId && flows.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="font-medium shrink-0">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_FILTER_FLOW}:</span>
              <select
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_FILTER_FLOW}
                value={selectedFlowId}
                onChange={(e) => {
                  setSelectedFlowId(e.target.value);
                  setSelectedJobId('ALL');
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="ALL">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_ALL_FLOWS}</option>
                {flows.map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Job Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium shrink-0">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_FILTER_JOB}:</span>
            <select
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_FILTER_JOB}
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="ALL">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_ALL_JOBS}</option>
              {visibleJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium shrink-0">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_FILTER_STATUS}:</span>
            <select
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_FILTER_STATUS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_STATUS_ALL}</option>
              <option value="SUCCESS">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_STATUS_SUCCESS}</option>
              <option value="FAILED">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_STATUS_FAILED}</option>
            </select>
          </div>

          {/* Date Range: From */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="font-medium shrink-0">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_DATE_FROM}:</span>
            <input
              type="date"
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_DATE_START}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            />
          </div>

          {/* Date Range: To */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium shrink-0">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_DATE_TO}:</span>
            <input
              type="date"
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_DATE_END}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            />
          </div>

          {/* Reset Filters */}
          {(selectedFlowId !== (flowId || 'ALL') || selectedJobId !== 'ALL' || statusFilter !== 'ALL' || startDate || endDate) && (
            <button
              type="button"
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_BTN_RESET}
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
            >
              {SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_RESET_FILTER}
            </button>
          )}
        </div>

      </div>

      {/* Logs Table Container */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading && executions.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-purple-500" />
            <span>{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_LOADING}</span>
          </div>
        ) : executions.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_EMPTY_TITLE}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_EMPTY_DESC}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_TABLE}
              className="w-full text-left text-xs border-collapse"
            >
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_COL_TIME}</th>
                  <th className="py-3 px-4">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_COL_JOB}</th>
                  {!flowId && <th className="py-3 px-4">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_COL_FLOW}</th>}
                  <th className="py-3 px-4">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_COL_ENV}</th>
                  <th className="py-3 px-4 text-center">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_COL_STATUS}</th>
                  <th className="py-3 px-4 text-center">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_COL_STEPS}</th>
                  <th className="py-3 px-4 text-right">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_COL_DURATION}</th>
                  <th className="py-3 px-4 text-right">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_COL_ACTIONS}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {executions.map((exec) => {
                  const isSuccess = exec.status === 'SUCCESS';
                  const jobName = exec.job?.name || (exec.executedBy?.startsWith('Job: ') ? exec.executedBy.replace('Job: ', '') : exec.executedBy || 'Scheduled Job');
                  const flowTitle = exec.flow?.name || 'Scenario Flow';
                  const envName = exec.environment?.name || 'Default';

                  return (
                    <tr
                      key={exec.id}
                      id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_ROW_PREFIX(exec.id)}
                      onClick={() => setSelectedExecution(exec)}
                      className="hover:bg-purple-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Time */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(exec.createdAt)}
                      </td>

                      {/* Job */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {jobName}
                        </div>
                        {exec.job?.scheduleType && (
                          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                            {exec.job.scheduleType === 'CRON' ? exec.job.cronExpression : exec.job.scheduleType}
                          </div>
                        )}
                      </td>

                      {/* Flow (if project-wide) */}
                      {!flowId && (
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {flowTitle}
                        </td>
                      )}

                      {/* Environment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {envName}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isSuccess ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>PASSED</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-500" />
                              <span>FAILED</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Steps Passed */}
                      <td className="py-3.5 px-4 text-center font-mono whitespace-nowrap">
                        <span className={isSuccess ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                          {exec.passedSteps}
                        </span>
                        <span className="text-slate-400">/{exec.totalSteps}</span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap text-slate-500">
                        {exec.durationMs}ms
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleExportSingleSession(exec.id, 'md', flowTitle)}
                            title={SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_EXPORT_SINGLE_MD}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportSingleSession(exec.id, 'csv', flowTitle)}
                            title={SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_EXPORT_SINGLE_CSV}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedExecution(exec)}
                            title={SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_VIEW_DETAIL}
                            className="px-2 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_VIEW_DETAIL}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div
            id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_PAGINATION}
            className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500"
          >
            <div className="flex items-center gap-3">
              <span>{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_PAGE_SHOWING(startEntry, endEntry, totalItems)}</span>

              {/* Page Size Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">{SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_PAGE_SIZE}</span>
                <select
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_PAGINATION_PAGE_SIZE}
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_PAGINATION_PREV}
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </div>

              <button
                type="button"
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.JOBS_LOGS_PAGINATION_NEXT}
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session Details Inspector Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedExecution.status === 'SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-rose-500/10 text-rose-600'
                  }`}
                >
                  {selectedExecution.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>
                      {selectedExecution.job?.name || selectedExecution.executedBy || 'Job Session'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ({selectedExecution.status})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatDate(selectedExecution.createdAt)} • {selectedExecution.durationMs}ms • Steps: {selectedExecution.passedSteps}/{selectedExecution.totalSteps}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportSingleSession(selectedExecution.id, 'md', selectedExecution.flow?.name)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                  <span>.MD</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSingleSession(selectedExecution.id, 'csv', selectedExecution.flow?.name)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>.CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExecution(null);
                    setSelectedInspectStep(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error Banner if any */}
            {selectedExecution.errorSummary && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Execution Error Summary</div>
                  <div className="font-mono text-[11px] mt-0.5">{selectedExecution.errorSummary}</div>
                </div>
              </div>
            )}

            {/* Steps Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Steps Executed ({selectedExecution.steps?.length || 0})
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {(selectedExecution.steps || []).map((step: any) => {
                  const stepSuccess = step.status === 'SUCCESS';
                  const isExpanded = selectedInspectStep?.id === step.id;

                  return (
                    <div key={step.id} className="p-3 bg-white dark:bg-slate-900">
                      <div
                        onClick={() => setSelectedInspectStep(isExpanded ? null : step)}
                        className="flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {stepSuccess ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">
                            #{step.stepOrder}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {step.stepName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {step.method}
                          </span>
                          <span className="text-xs font-mono text-slate-500 truncate hidden sm:inline">
                            {step.url}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {step.httpStatusCode && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                step.httpStatusCode < 400
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              }`}
                            >
                              HTTP {step.httpStatusCode}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            {step.durationMs}ms
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Step Inspector Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                          {step.errorMessage && (
                            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-mono">
                              {step.errorMessage}
                            </div>
                          )}

                          {/* Assertions */}
                          {step.assertionResults && step.assertionResults.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                {SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_INSPECT_ASSERTIONS} ({step.assertionResults.filter((a: any) => a.passed).length}/{step.assertionResults.length})
                              </div>
                              <div className="space-y-1 font-mono text-[11px]">
                                {step.assertionResults.map((a: any, i: number) => (
                                  <div
                                    key={i}
                                    className={`p-1.5 rounded-lg flex items-center justify-between ${
                                      a.passed
                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                                    }`}
                                  >
                                    <span>{a.rule?.type} {a.rule?.path ? `(${a.rule.path})` : ''} {a.rule?.operator} {JSON.stringify(a.rule?.expected)}</span>
                                    <span>{a.passed ? 'PASSED' : 'FAILED'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Response Snapshot Preview */}
                          {step.responseSnapshot?.body && (
                            <div className="space-y-1">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                {SCENARIO_FLOW_DETAIL_TEXT.JOBS_LOGS_INSPECT_RESPONSE_PREVIEW}
                              </div>
                              <pre className="p-2.5 rounded-xl bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-48">
                                {typeof step.responseSnapshot.body === 'object'
                                  ? JSON.stringify(step.responseSnapshot.body, null, 2)
                                  : String(step.responseSnapshot.body)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

