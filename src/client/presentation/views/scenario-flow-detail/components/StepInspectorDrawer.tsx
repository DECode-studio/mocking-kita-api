'use client';

import React from 'react';
import {
  X,
  Activity,
  Layers,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  ScenarioFlow,
  ScenarioFlowExecution,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { FlowExecutionPanel } from './FlowExecutionPanel';
import { StepExecutionInspector } from './StepExecutionInspector';
import { RunFlowButton } from './RunFlowButton';

interface StepInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  flow: ScenarioFlow;
  latestExecution: ScenarioFlowExecution | null;
  selectedStepIndex: number;
  isRunning?: boolean;
  elapsedMs?: number;
  runningProgress?: { current: number; total: number } | null;
  onRunFlow?: (iterations?: number) => void;
  onSelectStep: (index: number) => void;
}

export const StepInspectorDrawer: React.FC<StepInspectorDrawerProps> = ({
  isOpen,
  onClose,
  flow,
  latestExecution,
  selectedStepIndex,
  isRunning,
  elapsedMs,
  runningProgress,
  onRunFlow,
  onSelectStep,
}) => {
  if (!isOpen) return null;

  const steps = flow.steps || [];
  const activeExecutionStep = latestExecution?.steps?.[selectedStepIndex] || null;
  const currentStep = steps[selectedStepIndex] || null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-140 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Runner & Step Inspector
              </h2>
              {isRunning && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40 animate-pulse">
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-purple-500" />
                  RUNNING ({((elapsedMs || 0) / 1000).toFixed(1)}s)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Inspect sent payload, headers, response, and assertions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRunFlow && (
            <RunFlowButton
              isRunning={isRunning}
              elapsedMs={elapsedMs}
              runningProgress={runningProgress}
              disabled={!flow.steps || flow.steps.length === 0}
              onRunFlow={onRunFlow}
              size="sm"
              label="Run Test"
            />
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Step Selector Tab Pills */}
      {steps.length > 0 && (
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/40 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {steps.map((step, idx) => {
            const isSelected = selectedStepIndex === idx;
            const execStep = latestExecution?.steps?.[idx];
            const isSuccess = !isRunning && execStep?.status === 'SUCCESS';
            const isFailed = !isRunning && execStep?.status === 'FAILED';

            return (
              <button
                key={step.id}
                onClick={() => onSelectStep(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:border-purple-500/40'
                }`}
              >
                <span className="opacity-80">#{idx + 1}</span>
                <span className="truncate max-w-27.5">{step.name}</span>
                {isRunning && <Loader2 className="w-3 h-3 animate-spin text-purple-400" />}
                {isSuccess && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {isFailed && <XCircle className="w-3 h-3 text-rose-400" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Flow Execution Progress Overview */}
        <FlowExecutionPanel
          execution={latestExecution}
          flowName={flow.name}
          selectedStepIndex={selectedStepIndex}
          isRunning={isRunning}
          elapsedMs={elapsedMs}
          onSelectStep={onSelectStep}
        />

        {/* Selected Step Execution Inspector */}
        <StepExecutionInspector step={activeExecutionStep} isRunning={isRunning} />
      </div>
    </div>
  );
};
