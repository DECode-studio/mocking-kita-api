'use client';

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Play, ChevronDown, Loader2, Repeat, Zap, Hash } from 'lucide-react';
import { SCENARIO_FLOW_DETAIL_SEMANTIC_ID, SCENARIO_FLOW_DETAIL_TEXT } from '../constant';
import { useRunFlowButton } from '../hook';

export interface RunFlowButtonProps {
  isRunning?: boolean;
  elapsedMs?: number;
  runningProgress?: { current: number; total: number } | null;
  disabled?: boolean;
  onRunFlow: (iterations?: number) => void;
  size?: 'md' | 'sm';
  className?: string;
  label?: string;
}

export const RunFlowButton: React.FC<RunFlowButtonProps> = ({
  isRunning = false,
  elapsedMs = 0,
  runningProgress = null,
  disabled = false,
  onRunFlow,
  size = 'md',
  className = '',
  label = SCENARIO_FLOW_DETAIL_TEXT.RUN_TEST,
}) => {
  const {
    customN,
    setCustomN,
    isDropdownOpen,
    setIsDropdownOpen,
    handleQuickRun,
    handleCustomRun,
  } = useRunFlowButton({ onRunFlow });

  const isSmall = size === 'sm';

  if (isRunning) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-bold text-white rounded-xl bg-linear-to-r from-purple-600 via-indigo-600 to-purple-700 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/50 select-none animate-pulse ${
          isSmall ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'
        } ${className}`}
      >
        <Loader2 className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin text-purple-200`} />
        <span>
          {runningProgress && runningProgress.total > 1
            ? `Run ${runningProgress.current}/${runningProgress.total} (${((elapsedMs || 0) / 1000).toFixed(1)}s)`
            : `Running... (${((elapsedMs || 0) / 1000).toFixed(1)}s)`}
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-stretch rounded-xl shadow-sm ${className}`}>
      {/* Primary Action Button: Single Run */}
      <button
        id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.RUN_BTN}
        type="button"
        onClick={() => onRunFlow(1)}
        disabled={disabled}
        className={`inline-flex items-center gap-2 font-bold text-white bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-purple-500/25 ${
          isSmall
            ? 'px-3 py-1.5 text-xs rounded-l-xl rounded-r-none'
            : 'px-4 py-2 text-xs rounded-l-xl rounded-r-none'
        }`}
      >
        <Play className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill-current`} />
        <span>{label}</span>
      </button>

      {/* Dropdown Trigger for Loop / Iteration Options */}
      <DropdownMenu.Root open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.RUN_BTN_TRIGGER}
            type="button"
            disabled={disabled}
            title={SCENARIO_FLOW_DETAIL_TEXT.RUN_ITERATIONS_TITLE}
            className={`inline-flex items-center justify-center font-bold text-white bg-indigo-600 hover:bg-indigo-500 border-l border-white/20 rounded-r-xl transition-all disabled:opacity-50 cursor-pointer ${
              isSmall ? 'px-2 text-xs' : 'px-2.5 text-xs'
            }`}
          >
            <ChevronDown className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} opacity-90`} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="w-58 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-2xl z-50 text-xs text-slate-700 dark:text-slate-300 space-y-1 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Repeat className="w-3 h-3 text-purple-500" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.RUN_ITERATIONS_TITLE}</span>
              </span>
              <span className="text-[10px] text-purple-500 font-mono">
                {SCENARIO_FLOW_DETAIL_TEXT.LOOP_TEST_BADGE}
              </span>
            </div>

            {/* Quick Preset Options */}
            <DropdownMenu.Item
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.RUN_PRESET_PREFIX(1)}
              onClick={() => handleQuickRun(1)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer outline-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.SINGLE_RUN}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">1x</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.RUN_PRESET_PREFIX(3)}
              onClick={() => handleQuickRun(3)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer outline-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-purple-500" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.RUN_3X}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">3x</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.RUN_PRESET_PREFIX(5)}
              onClick={() => handleQuickRun(5)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer outline-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-indigo-500" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.RUN_5X}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">5x</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.RUN_PRESET_PREFIX(10)}
              onClick={() => handleQuickRun(10)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer outline-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-emerald-500" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.RUN_10X}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">10x</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

            {/* Custom N-x Integer Form */}
            <form onSubmit={handleCustomRun} className="p-2 space-y-2 bg-slate-50/60 dark:bg-slate-950/50 rounded-lg">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Hash className="w-3 h-3 text-purple-500" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.CUSTOM_N_LABEL}</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.RUN_CUSTOM_INPUT}
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={customN}
                  onChange={(e) => setCustomN(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-16 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.RUN_CUSTOM_SUBMIT}
                  type="submit"
                  className="flex-1 px-2.5 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>{SCENARIO_FLOW_DETAIL_TEXT.RUN_NX_BTN(customN)}</span>
                </button>
              </div>
            </form>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};
