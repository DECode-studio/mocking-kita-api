'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import { ScenarioFlowExecution } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import {
  exportExecutionToMarkdown,
  exportExecutionToCsv,
} from '../utils/scenarioFlowLogExport';

interface FlowExecutionPanelProps {
  execution: ScenarioFlowExecution | null;
  flowName?: string;
  selectedStepIndex: number;
  onSelectStep: (idx: number) => void;
}

export const FlowExecutionPanel: React.FC<FlowExecutionPanelProps> = ({
  execution,
  flowName,
  selectedStepIndex,
  onSelectStep,
}) => {
  if (!execution) {
    return (
      <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/40 space-y-2">
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

  const isSuccess = execution.status === 'SUCCESS';
  const steps = execution.steps || [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Execution Summary Top Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> All Steps Passed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" /> Execution Failed ({execution.passedSteps}/{execution.totalSteps})
            </span>
          )}
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {execution.durationMs}ms
          </span>
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
                  isSelected
                    ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-500/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-mono text-slate-400">Step {step.stepOrder}</span>
                  <div className="flex items-center gap-1">
                    {stepSkipped ? (
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
