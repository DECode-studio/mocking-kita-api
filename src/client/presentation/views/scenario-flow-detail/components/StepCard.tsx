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
  Play,
} from 'lucide-react';
import {
  ScenarioFlowStep,
  ScenarioFlowExecutionStep,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import {
  SCENARIO_FLOW_DETAIL_SEMANTIC_ID,
  SCENARIO_FLOW_DETAIL_TEXT,
} from '../constant';

interface StepCardProps {
  step: ScenarioFlowStep;
  index: number;
  totalSteps: number;
  isSelected?: boolean;
  isRunning?: boolean;
  isRunningStep?: boolean;
  executionStep?: ScenarioFlowExecutionStep | null;
  onSelect?: () => void;
  onDoubleClick?: () => void;
  onEdit: (step: ScenarioFlowStep) => void;
  onDelete: (stepId: string, stepName: string) => void;
  onToggleEnabled: (step: ScenarioFlowStep) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRunStep?: (step: ScenarioFlowStep) => void;
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
  isRunningStep,
  executionStep,
  onSelect,
  onDoubleClick,
  onEdit,
  onDelete,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
  onRunStep,
}) => {
  const method = (step.methodOverride || step.api?.methodRequest || 'GET').toUpperCase();
  const path = step.pathOverride || step.api?.path || '';
  const methodClass = METHOD_COLORS[method] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';

  const extractors = step.extractors || [];
  const assertions = step.assertions || [];

  const isCardRunning = isRunningStep || (isRunning && isRunningStep === undefined);

  let borderStyle = isSelected
    ? 'ring-2 ring-purple-500/50 border-purple-500 shadow-md shadow-purple-500/10'
    : '';

  if (isCardRunning) {
    borderStyle = 'ring-2 ring-purple-500/60 border-purple-500 shadow-lg shadow-purple-500/20 animate-pulse';
  } else if (!isRunning && executionStep?.status === 'SUCCESS') {
    borderStyle = 'border-emerald-500/60 ring-1 ring-emerald-500/20';
  } else if (!isRunning && executionStep?.status === 'FAILED') {
    borderStyle = 'border-rose-500/60 ring-1 ring-rose-500/20 shadow-xs shadow-rose-500/10';
  }

  return (
    <div
      id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_PREFIX(step.id)}
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
      title={SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_DOUBLE_CLICK_TOOLTIP}
      className={`w-full min-w-0 p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${borderStyle} ${
        step.enabled
          ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-purple-500/30'
          : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/40 dark:border-slate-800/40 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        {/* Step Index + Reorder Arrows */}
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="flex flex-col items-center shrink-0 pt-0.5">
            <button
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_MOVE_UP_PREFIX(step.id)}
              onClick={onMoveUp}
              disabled={index === 0}
              className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-20 p-0.5"
              title={SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_MOVE_UP}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <button
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_MOVE_DOWN_PREFIX(step.id)}
              onClick={onMoveDown}
              disabled={index === totalSteps - 1}
              className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-20 p-0.5"
              title={SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_MOVE_DOWN}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white wrap-break-word [overflow-wrap:anywhere]">
                {step.name}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border shrink-0 ${methodClass}`}
              >
                {method}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all wrap-anywhere">
                {path}
              </span>
              {step.targetEnvironmentType === 'LOCAL' && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  {SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_LOCAL_ONLY}
                </span>
              )}
              {step.targetEnvironment && step.targetEnvironmentType !== 'LOCAL' && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded-md border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 break-all shrink-0">
                  {step.targetEnvironment}
                </span>
              )}
            </div>

            {step.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 break-words [overflow-wrap:anywhere]">{step.description}</p>
            )}

            {step.requestScenario && (
              <p className="text-[11px] text-slate-400 break-words [overflow-wrap:anywhere]">
                {SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_SCENARIO_LABEL}{' '}
                <span className="text-slate-600 dark:text-slate-300 font-medium break-words [overflow-wrap:anywhere]">
                  {step.requestScenario.name}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {isCardRunning && !isRunningStep && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40 animate-pulse shadow-xs shadow-purple-500/20 shrink-0">
              <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
              {SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_RUNNING}
            </span>
          )}
          {!isCardRunning && executionStep?.status === 'SUCCESS' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {executionStep.httpStatusCode || 200} OK
            </span>
          )}
          {!isCardRunning && executionStep?.status === 'FAILED' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
              <XCircle className="w-3 h-3 text-rose-500" />
              {executionStep.httpStatusCode || 'ERR'}
            </span>
          )}
          {onRunStep && (
            <button
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_RUN_PREFIX(step.id)}
              onClick={(e) => {
                e.stopPropagation();
                onRunStep(step);
              }}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-all hover:scale-102 active:scale-98 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs shrink-0"
              title={SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_RUN_TOOLTIP}
            >
              {isRunningStep ? (
                <Loader2 className="w-3 h-3 animate-spin text-purple-600 dark:text-purple-400" />
              ) : (
                <Play className="w-3 h-3 fill-purple-600 dark:fill-purple-400 text-purple-600 dark:text-purple-400" />
              )}
              <span>
                {isRunningStep
                  ? SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_RUNNING
                  : SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_RUN_BTN}
              </span>
            </button>
          )}
          <button
            id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_TOGGLE_PREFIX(step.id)}
            onClick={() => onToggleEnabled(step)}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors shrink-0 ${
              step.enabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {step.enabled ? SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_ENABLED : SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_DISABLED}
          </button>
          <button
            id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_EDIT_PREFIX(step.id)}
            onClick={() => onEdit(step)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title={SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_EDIT_TOOLTIP}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_DELETE_PREFIX(step.id)}
            onClick={() => onDelete(step.id, step.name)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title={SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_DELETE_TOOLTIP}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Extra Pills: Extractors & Assertions */}
      {(extractors.length > 0 || assertions.length > 0 || step.delayMs > 0 || step.continueOnError) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px] min-w-0">
          {step.delayMs > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono shrink-0">
              <Clock className="w-3 h-3" />
              {SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_DELAY_LABEL(step.delayMs)}
            </span>
          )}

          {step.continueOnError && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-3 h-3" />
              {SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_CONTINUE_ON_ERROR}
            </span>
          )}

          {extractors.map((ext, i) => (
            <span
              key={i}
              className="inline-flex items-start gap-1 px-2 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono text-[10.5px] max-w-full min-w-0"
            >
              <Key className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />
              <span className="min-w-0 break-all [overflow-wrap:anywhere] leading-normal">
                &#123;&#123;{ext.variable}&#125;&#125; ← {ext.from}.{ext.path}
              </span>
            </span>
          ))}

          {assertions.map((ast, i) => (
            <span
              key={i}
              className="inline-flex items-start gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono text-[10.5px] max-w-full min-w-0"
            >
              <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
              <span className="min-w-0 break-all [overflow-wrap:anywhere] leading-normal">
                {ast.type} {ast.operator} {ast.expected !== undefined ? String(ast.expected) : ''}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
