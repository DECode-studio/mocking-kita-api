'use client';

import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Key,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ScenarioFlowStep,
  ScenarioFlowExecutionStep,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';

interface StepCardProps {
  step: ScenarioFlowStep;
  index: number;
  totalSteps: number;
  isSelected?: boolean;
  isRunning?: boolean;
  executionStep?: ScenarioFlowExecutionStep | null;
  onSelect?: () => void;
  onDoubleClick?: () => void;
  onEdit: (step: ScenarioFlowStep) => void;
  onDelete: (stepId: string, stepName: string) => void;
  onToggleEnabled: (step: ScenarioFlowStep) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  POST: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  PUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  PATCH: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  DELETE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  totalSteps,
  isSelected,
  isRunning,
  executionStep,
  onSelect,
  onDoubleClick,
  onEdit,
  onDelete,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
}) => {
  const method = (step.methodOverride || step.api?.methodRequest || 'GET').toUpperCase();
  const path = step.pathOverride || step.api?.path || '';
  const methodClass = METHOD_COLORS[method] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';

  const extractors = step.extractors || [];
  const assertions = step.assertions || [];

  let borderStyle = isSelected
    ? 'ring-2 ring-purple-500/50 border-purple-500 shadow-md shadow-purple-500/10'
    : '';

  if (isRunning) {
    borderStyle = 'ring-2 ring-purple-500/60 border-purple-500 shadow-lg shadow-purple-500/20 animate-pulse';
  } else if (!isRunning && executionStep?.status === 'SUCCESS') {
    borderStyle = 'border-emerald-500/60 ring-1 ring-emerald-500/20';
  } else if (!isRunning && executionStep?.status === 'FAILED') {
    borderStyle = 'border-rose-500/60 ring-1 ring-rose-500/20 shadow-xs shadow-rose-500/10';
  }

  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('input')) {
          return;
        }
        onSelect?.();
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('input')) {
          return;
        }
        onDoubleClick?.();
      }}
      title="Double-click to open step inspector"
      className={`p-4 rounded-2xl border transition-all cursor-pointer ${borderStyle} ${
        step.enabled
          ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-purple-500/30'
          : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/40 dark:border-slate-800/40 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Step Index + Reorder Arrows */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-20 p-0.5"
              title="Move Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <button
              onClick={onMoveDown}
              disabled={index === totalSteps - 1}
              className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-20 p-0.5"
              title="Move Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {step.name}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border ${methodClass}`}
              >
                {method}
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                {path}
              </span>
              {step.targetEnvironmentType === 'LOCAL' && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  LOCAL ONLY
                </span>
              )}
              {step.targetEnvironment && step.targetEnvironmentType !== 'LOCAL' && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded-md border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {step.targetEnvironment}
                </span>
              )}
            </div>

            {step.description && (
              <p className="text-[11px] text-slate-500">{step.description}</p>
            )}

            {step.requestScenario && (
              <p className="text-[11px] text-slate-400">
                Scenario:{' '}
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {step.requestScenario.name}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isRunning && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40 animate-pulse shadow-xs shadow-purple-500/20">
              <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
              RUNNING
            </span>
          )}
          {!isRunning && executionStep?.status === 'SUCCESS' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {executionStep.httpStatusCode || 200} OK
            </span>
          )}
          {!isRunning && executionStep?.status === 'FAILED' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <XCircle className="w-3 h-3 text-rose-500" />
              {executionStep.httpStatusCode || 'ERR'}
            </span>
          )}
          <button
            onClick={() => onToggleEnabled(step)}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
              step.enabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {step.enabled ? 'Enabled' : 'Disabled'}
          </button>
          <button
            onClick={() => onEdit(step)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Edit Step"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(step.id, step.name)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Delete Step"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Extra Pills: Extractors & Assertions */}
      {(extractors.length > 0 || assertions.length > 0 || step.delayMs > 0 || step.continueOnError) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
          {step.delayMs > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
              <Clock className="w-3 h-3" />
              {step.delayMs}ms delay
            </span>
          )}

          {step.continueOnError && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3 h-3" />
              continue on error
            </span>
          )}

          {extractors.map((ext, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono"
            >
              <Key className="w-3 h-3 text-purple-500" />
              &#123;&#123;{ext.variable}&#125;&#125; ← {ext.from}.{ext.path}
            </span>
          ))}

          {assertions.map((ast, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono"
            >
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              {ast.type} {ast.operator} {ast.expected !== undefined ? String(ast.expected) : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
