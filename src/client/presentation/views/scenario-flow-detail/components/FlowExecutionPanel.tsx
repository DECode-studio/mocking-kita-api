import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  FileDown,
  FileSpreadsheet,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ScenarioFlowExecution } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import {
  exportExecutionToMarkdown,
  exportExecutionToCsv,
} from '../utils/scenarioFlowLogExport';
import { SCENARIO_FLOW_DETAIL_SEMANTIC_ID, SCENARIO_FLOW_DETAIL_TEXT } from '../constant';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  POST: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  PUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  PATCH: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  DELETE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const PAGE_SIZE = 5;

interface FlowExecutionPanelProps {
  execution: ScenarioFlowExecution | null;
  executions?: ScenarioFlowExecution[];
  flowName?: string;
  selectedStepIndex: number;
  isRunning?: boolean;
  elapsedMs?: number;
  onSelectStep: (idx: number) => void;
}

export const FlowExecutionPanel: React.FC<FlowExecutionPanelProps> = ({
  execution,
  executions,
  flowName,
  selectedStepIndex,
  isRunning,
  elapsedMs,
  onSelectStep,
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const currentExecutions = executions && executions.length > 0 ? executions : execution ? [execution] : [];
  const steps = execution?.steps || [];
  const totalPages = Math.max(1, Math.ceil(steps.length / PAGE_SIZE));

  React.useEffect(() => {
    if (selectedStepIndex >= 0 && steps.length > 0) {
      const pageForSelected = Math.floor(selectedStepIndex / PAGE_SIZE) + 1;
      if (pageForSelected <= totalPages) {
        setCurrentPage(pageForSelected);
      }
    }
  }, [selectedStepIndex, steps.length, totalPages]);

  if (!execution && !isRunning) {
    return (
      <div
        id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_PANEL}
        className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/40 space-y-2"
      >
        <Activity className="w-8 h-8 mx-auto text-purple-500 opacity-60" />
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {SCENARIO_FLOW_DETAIL_TEXT.READY_FOR_TESTING_TITLE}
        </h3>
        <p className="text-[11px] text-slate-500">
          {SCENARIO_FLOW_DETAIL_TEXT.READY_FOR_TESTING_DESC}
        </p>
      </div>
    );
  }

  const isSuccess = execution?.status === 'SUCCESS';
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedSteps = steps.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div
      id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_PANEL}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
    >
      {/* Live Running Shimmer Banner */}
      {isRunning && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 border border-purple-500/30 p-4 shadow-sm space-y-2.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-100 dark:bg-purple-950/40 overflow-hidden">
            <div className="h-full w-full bg-linear-to-r from-purple-500 via-pink-500 to-indigo-500 animate-pulse" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{SCENARIO_FLOW_DETAIL_TEXT.EXECUTING_FLOW_TITLE}</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                </h4>
                <p className="text-[11px] text-slate-500">
                  {SCENARIO_FLOW_DETAIL_TEXT.EXECUTING_FLOW_DESC}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold shrink-0">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              <span>{((elapsedMs || 0) / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Execution Summary Top Bar */}
      {execution && (
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {isRunning ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> {SCENARIO_FLOW_DETAIL_TEXT.RUNNING_BTN}
              </span>
            ) : isSuccess ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> {SCENARIO_FLOW_DETAIL_TEXT.ALL_STEPS_PASSED}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <XCircle className="w-4 h-4" /> {SCENARIO_FLOW_DETAIL_TEXT.EXECUTION_FAILED_PREFIX} ({execution.passedSteps}/{execution.totalSteps})
              </span>
            )}
            {!isRunning && (
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {execution.durationMs}ms
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Target: <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{execution.targetMode}</span>
              {execution.environment && (
                <span className="ml-1 text-purple-600 dark:text-purple-400 font-medium font-mono">
                  ({execution.environment.name})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_EXPORT_MD}
                onClick={() => exportExecutionToMarkdown(currentExecutions, flowName)}
                title="Download test execution log as Markdown (.md)"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.EXPORT_MD}</span>
              </button>
              <button
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_EXPORT_CSV}
                onClick={() => exportExecutionToCsv(currentExecutions, flowName)}
                title="Download test execution log as CSV (.csv)"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.EXPORT_CSV}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Timeline */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
          {SCENARIO_FLOW_DETAIL_TEXT.EXECUTION_TIMELINE_LABEL}
        </span>
        <div
          id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_TIMELINE}
          className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/20"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">
                    {SCENARIO_FLOW_DETAIL_TEXT.TABLE_HEADER_STEP}
                  </th>
                  <th className="py-2.5 px-3">
                    {SCENARIO_FLOW_DETAIL_TEXT.TABLE_HEADER_NAME}
                  </th>
                  <th className="py-2.5 px-3 w-20">
                    {SCENARIO_FLOW_DETAIL_TEXT.TABLE_HEADER_METHOD}
                  </th>
                  <th className="py-2.5 px-3 w-28">
                    {SCENARIO_FLOW_DETAIL_TEXT.TABLE_HEADER_STATUS}
                  </th>
                  <th className="py-2.5 px-3 w-24 text-right">
                    {SCENARIO_FLOW_DETAIL_TEXT.TABLE_HEADER_DURATION}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {paginatedSteps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                      {SCENARIO_FLOW_DETAIL_TEXT.NO_STEPS_RECORDED}
                    </td>
                  </tr>
                ) : (
                  paginatedSteps.map((step, i) => {
                    const absoluteIndex = startIndex + i;
                    const stepPassed = step.status === 'SUCCESS';
                    const stepSkipped = step.status === 'SKIPPED';
                    const isSelected = selectedStepIndex === absoluteIndex;
                    const method = (step.method || 'GET').toUpperCase();
                    const methodClass =
                      METHOD_COLORS[method] ||
                      'bg-slate-500/10 text-slate-500 border-slate-500/20';

                    return (
                      <tr
                        key={step.id || absoluteIndex}
                        id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_STEP_PREFIX(absoluteIndex)}
                        onClick={() => onSelectStep(absoluteIndex)}
                        className={`transition-all cursor-pointer ${
                          isRunning
                            ? 'bg-purple-500/5 hover:bg-purple-500/10 animate-pulse'
                            : isSelected
                            ? 'bg-purple-500/10 dark:bg-purple-500/20 border-l-2 border-l-purple-500 font-medium'
                            : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-mono font-bold ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {step.stepOrder || absoluteIndex + 1}
                          </span>
                        </td>
                        <td
                          className="py-2 px-3 text-slate-900 dark:text-slate-100 font-medium max-w-45 truncate"
                          title={step.stepName}
                        >
                          {step.stepName}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${methodClass}`}
                          >
                            {method}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {isRunning ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> RUNNING
                            </span>
                          ) : stepSkipped ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-500">
                              SKIPPED
                            </span>
                          ) : stepPassed ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                              {step.httpStatusCode || 200} OK
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                              {step.httpStatusCode || 'FAIL'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {step.durationMs}ms
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_PAGINATION}
              className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-900/40"
            >
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {SCENARIO_FLOW_DETAIL_TEXT.TABLE_PAGINATION_SHOWING(
                  startIndex + 1,
                  Math.min(startIndex + PAGE_SIZE, steps.length),
                  steps.length
                )}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_PAGE_PREV}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                  }}
                  disabled={currentPage === 1}
                  className="p-1 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title={SCENARIO_FLOW_DETAIL_TEXT.TABLE_PREV}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 px-1.5">
                  {SCENARIO_FLOW_DETAIL_TEXT.TABLE_PAGE_LABEL(currentPage, totalPages)}
                </span>
                <button
                  type="button"
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_PAGE_NEXT}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                  }}
                  disabled={currentPage === totalPages}
                  className="p-1 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title={SCENARIO_FLOW_DETAIL_TEXT.TABLE_NEXT}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
