'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Download,
  Plus,
  History,
  Server,
  Loader2,
  CheckCircle2,
  Layers,
  Network,
  List,
  Sparkles,
  Edit2,
} from 'lucide-react';
import { ScenarioFlow } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { EnvironmentType } from '@/src/core/utils/types';
import { SCENARIO_FLOW_DETAIL_TEXT } from '../constant/scenarioFlowDetailText';
import { ROUTES } from '@/src/core/constants/routes';
import { RunFlowButton } from './RunFlowButton';

const ENVIRONMENT_TYPES: EnvironmentType[] = [
  'DEVELOPMENT',
  'TESTING',
  'STAGING',
  'PRODUCTION',
  'LOCAL',
];

interface ScenarioFlowDetailHeaderProps {
  flow: ScenarioFlow;
  projectId?: string;
  environments: Environment[];
  selectedEnvironmentType: string;
  setSelectedEnvironmentType: (type: string) => void;
  targetMode: 'LIVE' | 'MOCK';
  setTargetMode: (mode: 'LIVE' | 'MOCK') => void;
  viewMode: 'canvas' | 'list';
  onToggleViewMode: (mode: 'canvas' | 'list') => void;
  onAutoArrange?: () => void;
  isRunning: boolean;
  elapsedMs?: number;
  runningProgress?: { current: number; total: number } | null;
  onRunFlow: (iterations?: number) => void;
  onExport: () => void;
  onOpenAddStep: () => void;
  onOpenHistory: () => void;
  onOpenEditFlow?: () => void;
}

export const ScenarioFlowDetailHeader: React.FC<ScenarioFlowDetailHeaderProps> = ({
  flow,
  projectId,
  environments,
  selectedEnvironmentType,
  setSelectedEnvironmentType,
  targetMode,
  setTargetMode,
  viewMode,
  onToggleViewMode,
  onAutoArrange,
  isRunning,
  elapsedMs,
  runningProgress,
  onRunFlow,
  onExport,
  onOpenAddStep,
  onOpenHistory,
  onOpenEditFlow,
}) => {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Top Indeterminate Progress Bar */}
      {isRunning && (
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden bg-purple-100 dark:bg-purple-950/60 z-10">
          <div className="h-full w-full bg-linear-to-r from-purple-500 via-pink-500 to-indigo-500 animate-pulse" />
        </div>
      )}
      {/* Top Row: Flow Title & Meta Info */}
      <div className="flex items-start gap-3.5">
        <Link
          href={projectId ? ROUTES.PROJECT_SCENARIO_FLOWS(projectId) : ROUTES.SCENARIO_FLOWS}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 mt-0.5"
          title={SCENARIO_FLOW_DETAIL_TEXT.BACK_TO_FLOWS}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
          <Layers className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {flow.name}
              </h1>
              {onOpenEditFlow && (
                <button
                  onClick={onOpenEditFlow}
                  className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Edit Flow Title & Description"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                flow.status
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-500/10 text-slate-500'
              }`}
            >
              {flow.status ? 'Active' : 'Draft'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              {flow.project?.name ? `📁 ${flow.project.name}` : '🌐 Cross-Project Flow'}
            </span>
          </div>

          {flow.description ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
              {flow.description}
            </p>
          ) : onOpenEditFlow ? (
            <button
              onClick={onOpenEditFlow}
              className="text-xs text-slate-400 hover:text-purple-500 italic transition-colors cursor-pointer"
            >
              + Add flow description...
            </button>
          ) : null}
        </div>
      </div>

      {/* Bottom Row: Actions & Controls Bar */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left Side Controls: View Mode & Environment Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950 text-xs">
            <button
              onClick={() => onToggleViewMode('canvas')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Interactive Diagram Flow Canvas"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Diagram Flow</span>
            </button>
            <button
              onClick={() => onToggleViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Classic Sequential List"
            >
              <List className="w-3.5 h-3.5" />
              <span>Classic List</span>
            </button>
          </div>

          {/* Target Environment Stage Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs shadow-2xs">
            <Server className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <select
              value={selectedEnvironmentType}
              onChange={(e) => setSelectedEnvironmentType(e.target.value)}
              className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              {ENVIRONMENT_TYPES.map((envType) => (
                <option
                  key={envType}
                  value={envType}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {envType === 'LOCAL' ? 'LOCAL (APP_URL)' : envType}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side Controls: History, Export, Add Step, Run Testing */}
        <div className="flex flex-wrap items-center gap-2">
          {/* History Modal Button */}
          <button
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="View Run History"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{SCENARIO_FLOW_DETAIL_TEXT.HISTORY_BTN}</span>
          </button>

          {/* Export Button */}
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{SCENARIO_FLOW_DETAIL_TEXT.EXPORT_BTN}</span>
          </button>

          {/* Add Step Button */}
          <button
            onClick={onOpenAddStep}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{SCENARIO_FLOW_DETAIL_TEXT.ADD_STEP_BTN}</span>
          </button>

          {/* Run Real Testing Button with Multi-run Dropdown */}
          <RunFlowButton
            isRunning={isRunning}
            elapsedMs={elapsedMs}
            runningProgress={runningProgress}
            disabled={!flow.steps || flow.steps.length === 0}
            onRunFlow={onRunFlow}
            label={SCENARIO_FLOW_DETAIL_TEXT.RUN_TEST_BTN}
          />
        </div>
      </div>
    </div>
  );
};
