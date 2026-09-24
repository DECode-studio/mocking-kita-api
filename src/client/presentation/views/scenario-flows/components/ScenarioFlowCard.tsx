'use client';

import React from 'react';
import Link from 'next/link';
import {
  Play,
  Download,
  Trash2,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Server,
  Loader2,
} from 'lucide-react';
import { ScenarioFlow } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { ROUTES } from '@/src/core/constants/routes';
import { SCENARIO_FLOWS_SEMANTIC_ID, SCENARIO_FLOWS_TEXT } from '../constant';

interface ScenarioFlowCardProps {
  flow: ScenarioFlow;
  projectId?: string;
  isRunning: boolean;
  onQuickRun: (flow: ScenarioFlow) => void;
  onExport: (flowId: string, flowName: string) => void;
  onDelete: (flowId: string, flowName: string) => void;
}

export const ScenarioFlowCard: React.FC<ScenarioFlowCardProps> = ({
  flow,
  isRunning,
  onQuickRun,
  onExport,
  onDelete,
}) => {
  const stepsCount = flow.steps?.length ?? 0;
  const latestExecution = flow.executions?.[0];
  const targetDetailUrl = flow.projectId
    ? ROUTES.SCENARIO_FLOW_DETAIL(flow.projectId, flow.id)
    : ROUTES.SCENARIO_FLOW_DETAIL_GLOBAL(flow.id);

  return (
    <div
      id={SCENARIO_FLOWS_SEMANTIC_ID.FLOW_CARD_PREFIX(flow.id)}
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-purple-500/30 dark:hover:border-purple-500/30 transition-all flex flex-col justify-between group"
    >
      <div className="space-y-3.5">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <Link
                href={targetDetailUrl}
                className="text-sm font-bold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-1"
                title={flow.name}
              >
                {flow.name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    flow.status
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-500/10 text-slate-500'
                  }`}
                >
                  {flow.status ? SCENARIO_FLOWS_TEXT.STATUS_ACTIVE : SCENARIO_FLOWS_TEXT.STATUS_INACTIVE}
                </span>
                {flow.project ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    {flow.project.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    🌐 {SCENARIO_FLOWS_TEXT.CROSS_PROJECT_BADGE}
                  </span>
                )}
                {flow.defaultEnvironment && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Server className="w-2.5 h-2.5" />
                    {flow.defaultEnvironment.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              id={SCENARIO_FLOWS_SEMANTIC_ID.FLOW_EXPORT_BTN_PREFIX(flow.id)}
              onClick={() => onExport(flow.id, flow.name)}
              title={SCENARIO_FLOWS_TEXT.EXPORT_JSON}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              id={SCENARIO_FLOWS_SEMANTIC_ID.FLOW_DELETE_BTN_PREFIX(flow.id)}
              onClick={() => onDelete(flow.id, flow.name)}
              title={SCENARIO_FLOWS_TEXT.DELETE}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        {flow.description ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {flow.description}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">{SCENARIO_FLOWS_TEXT.CARD_NO_DESC}</p>
        )}

        {/* Metrics Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white font-mono">{stepsCount}</span>
            <span className="text-slate-500 text-[11px]">{SCENARIO_FLOWS_TEXT.STEPS_COUNT}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          {/* Last run indicator */}
          {latestExecution ? (
            <div className="flex items-center gap-1.5 text-[11px]">
              {latestExecution.status === 'SUCCESS' ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passed ({latestExecution.durationMs}ms)
                </span>
              ) : latestExecution.status === 'RUNNING' ? (
                <span className="inline-flex items-center gap-1 text-blue-500 font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {SCENARIO_FLOWS_TEXT.RUNNING}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                  <XCircle className="w-3.5 h-3.5" /> {SCENARIO_FLOWS_TEXT.FAILED_BADGE} ({latestExecution.passedSteps}/{latestExecution.totalSteps})
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{SCENARIO_FLOWS_TEXT.NO_RUNS_YET}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer action buttons */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <button
          id={SCENARIO_FLOWS_SEMANTIC_ID.FLOW_RUN_BTN_PREFIX(flow.id)}
          onClick={() => onQuickRun(flow)}
          disabled={isRunning || stepsCount === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 shadow-xs shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {SCENARIO_FLOWS_TEXT.RUNNING}
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              {SCENARIO_FLOWS_TEXT.CARD_RUN_TEST}
            </>
          )}
        </button>

        <Link
          id={SCENARIO_FLOWS_SEMANTIC_ID.FLOW_BUILDER_LINK_PREFIX(flow.id)}
          href={targetDetailUrl}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span>{SCENARIO_FLOWS_TEXT.CARD_OPEN_BUILDER}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
