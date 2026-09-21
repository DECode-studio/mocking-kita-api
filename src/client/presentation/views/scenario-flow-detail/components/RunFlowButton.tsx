'use client';

import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Play, ChevronDown, Loader2, Repeat, Zap, Hash } from 'lucide-react';

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
  label = 'Run Test',
}) => {
  const [customN, setCustomN] = useState<number>(3);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isSmall = size === 'sm';

  const handleQuickRun = (n: number) => {
    setIsDropdownOpen(false);
    onRunFlow(n);
  };

  const handleCustomRun = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const count = Math.max(1, Math.min(100, Math.floor(Number(customN) || 1)));
    setIsDropdownOpen(false);
    onRunFlow(count);
  };

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
    <div
      className={`inline-flex items-stretch rounded-xl shadow-md shadow-purple-500/20 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all overflow-hidden ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Main Single Run Action Button */}
      <button
        type="button"
        onClick={() => onRunFlow(1)}
        disabled={disabled}
        title="Run flow 1 time"
        className={`inline-flex items-center gap-1.5 font-bold hover:bg-black/10 active:scale-98 transition-all cursor-pointer ${
          isSmall ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
        }`}
      >
        <Play className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill-current`} />
        <span>{label}</span>
      </button>

      {/* Divider */}
      <div className="w-px bg-white/20 my-1" />

      {/* Dropdown Trigger for Multiple Runs */}
      <DropdownMenu.Root open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            title="Choose run iterations (1x, 3x, 5x, Nx)"
            className={`flex items-center justify-center hover:bg-black/10 active:scale-98 transition-all cursor-pointer focus:outline-none ${
              isSmall ? 'px-2' : 'px-2.5'
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
                <span>Run Iterations</span>
              </span>
              <span className="text-[10px] text-purple-500 font-mono">Loop Test</span>
            </div>

            {/* Quick Preset Options */}
            <DropdownMenu.Item
              onClick={() => handleQuickRun(1)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer outline-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Run 1x (Single Run)</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">1x</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onClick={() => handleQuickRun(3)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer outline-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-purple-500" />
                <span>Run 3x (Loop 3 times)</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">3x</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onClick={() => handleQuickRun(5)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer outline-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-indigo-500" />
                <span>Run 5x (Loop 5 times)</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">5x</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onClick={() => handleQuickRun(10)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer outline-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-emerald-500" />
                <span>Run 10x (Loop 10 times)</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">10x</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

            {/* Custom N-x Integer Form */}
            <form onSubmit={handleCustomRun} className="p-2 space-y-2 bg-slate-50/60 dark:bg-slate-950/50 rounded-lg">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Hash className="w-3 h-3 text-purple-500" />
                <span>Run Custom N Times:</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
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
                  type="submit"
                  className="flex-1 px-2.5 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Run {customN}x</span>
                </button>
              </div>
            </form>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};
