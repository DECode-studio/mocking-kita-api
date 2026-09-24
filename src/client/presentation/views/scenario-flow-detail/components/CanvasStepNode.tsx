'use client';

import React, { useRef, useState } from 'react';
import {
  Edit2,
  Trash2,
  Key,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  GripHorizontal,
} from 'lucide-react';
import {
  ScenarioFlowStep,
  ScenarioFlowExecutionStep,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import {
  SCENARIO_FLOW_DETAIL_SEMANTIC_ID,
  SCENARIO_FLOW_DETAIL_TEXT,
} from '../constant';

interface CanvasStepNodeProps {
  step: ScenarioFlowStep;
  index: number;
  totalSteps: number;
  position: { x: number; y: number };
  isSelected: boolean;
  executionStep?: ScenarioFlowExecutionStep | null;
  isRunning?: boolean;
  zoom: number;
  onPositionChange: (stepId: string, x: number, y: number) => void;
  onSelect: () => void;
  onDoubleClick?: () => void;
  onEdit: (step: ScenarioFlowStep) => void;
  onDelete: (stepId: string, stepName: string) => void;
  onToggleEnabled: (step: ScenarioFlowStep) => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  POST: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  PUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  PATCH: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  DELETE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export const CanvasStepNode: React.FC<CanvasStepNodeProps> = ({
  step,
  index,
  totalSteps,
  position,
  isSelected,
  executionStep,
  isRunning,
  zoom,
  onPositionChange,
  onSelect,
  onDoubleClick,
  onEdit,
  onDelete,
  onToggleEnabled,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  const method = (step.methodOverride || step.api?.methodRequest || 'GET').toUpperCase();
  const path = step.pathOverride || step.api?.path || '';
  const methodClass = METHOD_COLORS[method] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';

  const extractors = step.extractors || [];
  const assertions = step.assertions || [];

  // Drag handlers using PointerEvents
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with main button (left click)
    if (e.button !== 0) return;

    // Don't initiate drag if clicking buttons, inputs, or interactive controls
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }

    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    setIsDragging(true);
    onSelect();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    e.stopPropagation();

    const dx = (e.clientX - dragStartRef.current.startX) / zoom;
    const dy = (e.clientY - dragStartRef.current.startY) / zoom;

    const newX = Math.round(dragStartRef.current.posX + dx);
    const newY = Math.round(dragStartRef.current.posY + dy);

    onPositionChange(step.id, newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Execution badge & border state
  const isStepRunning = isRunning;
  const isStepSuccess = !isRunning && executionStep?.status === 'SUCCESS';
  const isStepFailed = !isRunning && executionStep?.status === 'FAILED';

  let borderStyle = 'border-slate-200/90 dark:border-slate-800';
  let glowShadow = 'shadow-md';

  if (isStepRunning) {
    borderStyle = 'border-purple-500 ring-2 ring-purple-500/60 animate-pulse';
    glowShadow = 'shadow-xl shadow-purple-500/25';
  } else if (isSelected) {
    borderStyle = 'border-purple-500 ring-2 ring-purple-500/30';
    glowShadow = 'shadow-lg shadow-purple-500/10';
  } else if (isStepSuccess) {
    borderStyle = 'border-emerald-500/60 ring-1 ring-emerald-500/20';
  } else if (isStepFailed) {
    borderStyle = 'border-rose-500/70 ring-1 ring-rose-500/30';
    glowShadow = 'shadow-lg shadow-rose-500/10';
  }

  return (
    <div
      id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.CANVAS_NODE_PREFIX(step.id)}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '380px',
        zIndex: isDragging ? 50 : isSelected ? 30 : 10,
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('input')) {
          return;
        }
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('input')) {
          return;
        }
        e.stopPropagation();
        onDoubleClick?.();
      }}
      title={SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_DOUBLE_CLICK_TOOLTIP}
      className={`group select-none rounded-2xl border transition-shadow cursor-grab active:cursor-grabbing ${borderStyle} ${glowShadow} ${
        step.enabled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md'
          : 'bg-slate-50/70 dark:bg-slate-950/70 opacity-60'
      }`}
    >
      {/* Left Input Port Dot */}
      {index > 0 && (
        <div
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border-2 border-purple-500 flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform"
          title={SCENARIO_FLOW_DETAIL_TEXT.CANVAS_PORT_INPUT_TOOLTIP}
        >
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        </div>
      )}

      {/* Right Output Port Dot */}
      {index < totalSteps - 1 && (
        <div
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform"
          title={SCENARIO_FLOW_DETAIL_TEXT.CANVAS_PORT_OUTPUT_TOOLTIP}
        >
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        </div>
      )}

      {/* Header Bar / Drag Grip */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 transition-colors" />
          <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-mono text-[11px] font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 font-mono">
            {SCENARIO_FLOW_DETAIL_TEXT.CANVAS_STEP_INDEX_LABEL(index + 1, totalSteps)}
          </span>
        </div>

        {/* Execution Status Badge */}
        <div className="flex items-center gap-1.5">
          {isStepRunning && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 animate-pulse border border-purple-500/40 shadow-xs shadow-purple-500/20">
              <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
              {SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_RUNNING}
            </span>
          )}
          {isStepSuccess && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="w-2.5 h-2.5" />
              {executionStep.httpStatusCode || 200} OK ({executionStep.durationMs}ms)
            </span>
          )}
          {isStepFailed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <XCircle className="w-2.5 h-2.5" />
              {executionStep.httpStatusCode || 'ERR'} ({executionStep.durationMs}ms)
            </span>
          )}

          {/* Toggle Enable Button */}
          <button
            id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_TOGGLE_PREFIX(step.id)}
            onClick={() => onToggleEnabled(step)}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              step.enabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {step.enabled ? SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_ENABLED : SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_DISABLED}
          </button>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {step.name}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border ${methodClass}`}
              >
                {method}
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all">
                {path}
              </span>
              {step.targetEnvironmentType === 'LOCAL' && (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_LOCAL_ONLY}
                </span>
              )}
              {step.targetEnvironment && step.targetEnvironmentType !== 'LOCAL' && (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded-md border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {step.targetEnvironment}
                </span>
              )}
            </div>

            {step.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {step.description}
              </p>
            )}

            {step.requestScenario && (
              <p className="text-[11px] text-slate-400">
                {SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_SCENARIO_LABEL}{' '}
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {step.requestScenario.name}
                </span>
              </p>
            )}
          </div>

          {/* Card Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_EDIT_PREFIX(step.id)}
              onClick={() => onEdit(step)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_EDIT_TOOLTIP}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_DELETE_PREFIX(step.id)}
              onClick={() => onDelete(step.id, step.name)}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_DELETE_TOOLTIP}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feature Pills: Extractors, Assertions, Delays */}
        {(extractors.length > 0 || assertions.length > 0 || step.delayMs > 0 || step.continueOnError) && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
            {step.delayMs > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                <Clock className="w-2.5 h-2.5" />
                {SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_DELAY_LABEL(step.delayMs)}
              </span>
            )}

            {step.continueOnError && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px]">
                <AlertTriangle className="w-2.5 h-2.5" />
                {SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_CONTINUE_ON_ERROR}
              </span>
            )}

            {extractors.map((ext, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono text-[10px]"
              >
                <Key className="w-2.5 h-2.5 text-purple-500" />
                &#123;&#123;{ext.variable}&#125;&#125; ← {ext.from}.{ext.path}
              </span>
            ))}

            {assertions.map((ast, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono text-[10px]"
              >
                <ShieldCheck className="w-2.5 h-2.5 text-blue-500" />
                {ast.type} {ast.operator} {ast.expected !== undefined ? String(ast.expected) : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
