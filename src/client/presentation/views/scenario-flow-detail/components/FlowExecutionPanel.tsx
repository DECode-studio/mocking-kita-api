import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  FileDown,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { ScenarioFlowExecution } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import {
  exportExecutionToMarkdown,
  exportExecutionToCsv,
} from '../utils/scenarioFlowLogExport';
import { SCENARIO_FLOW_DETAIL_SEMANTIC_ID } from '../constant';

interface FlowExecutionPanelProps {
  execution: ScenarioFlowExecution | null;
  flowName?: string;
  selectedStepIndex: number;
  isRunning?: boolean;
  elapsedMs?: number;
  onSelectStep: (idx: number) => void;
}

export const FlowExecutionPanel: React.FC<FlowExecutionPanelProps> = ({
  execution,
  flowName,
  selectedStepIndex,
  isRunning,
  elapsedMs,
  onSelectStep,
}) => {
  if (!execution && !isRunning) {
    return (
      <div
        id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_PANEL}
        className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/40 space-y-2"
      >
        <Activity className="w-8 h-8 mx-auto text-purple-500 opacity-60" />
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Ready for Real Testing
        </h3>
        <p className="text-[11px] text-slate-500">
          Click "Run Real Testing" to execute all steps sequentially on the server.
        </p>
      </div>
    );
  }

  const isSuccess = execution?.status === 'SUCCESS';
  const steps = execution?.steps || [];

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
                  <span>Executing Scenario Flow...</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                </h4>
                <p className="text-[11px] text-slate-500">
                  Sending chained HTTP requests sequentially & validating assertions
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
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> Running Live Execution...
              </span>
            ) : isSuccess ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> All Steps Passed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <XCircle className="w-4 h-4" /> Execution Failed ({execution.passedSteps}/{execution.totalSteps})
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
              onClick={() => exportExecutionToMarkdown(execution, flowName)}
              title="Download test execution log as Markdown (.md)"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export MD</span>
            </button>
            <button
              onClick={() => exportExecutionToCsv(execution, flowName)}
              title="Download test execution log as CSV (.csv)"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Stepper Timeline */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
          Execution Timeline
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {steps.map((step, idx) => {
            const stepPassed = step.status === 'SUCCESS';
            const stepSkipped = step.status === 'SKIPPED';
            const isSelected = selectedStepIndex === idx;

            return (
              <button
                key={step.id || idx}
                onClick={() => onSelectStep(idx)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isRunning
                    ? 'border-purple-500/50 bg-purple-500/5 ring-1 ring-purple-500/30 animate-pulse'
                    : isSelected
                    ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-500/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-mono text-slate-400">Step {step.stepOrder}</span>
                  <div className="flex items-center gap-1">
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
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {step.stepName}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-1">
                  <span className="truncate">{step.method}</span>
                  <span>{step.durationMs}ms</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
