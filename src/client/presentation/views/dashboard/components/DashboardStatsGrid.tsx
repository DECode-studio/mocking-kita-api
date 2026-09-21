'use client';


import { FolderGit2, Layers, FileCode } from 'lucide-react';
import { DashboardSummary } from '@/src/client/domain/dashboard/entity/dashboard_summary';
import { DASHBOARD_TEXT, DASHBOARD_SEMANTIC_ID } from '../constant';

interface DashboardStatsGridProps {
  summary: DashboardSummary;
  totalApisCount: number;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  summary,
  totalApisCount,
}) => {
  return (
    <div id={DASHBOARD_SEMANTIC_ID.STATS_GRID} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
      {/* Projects Card */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
            {DASHBOARD_TEXT.STATS_PROJECTS}
          </span>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <FolderGit2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
            {summary.projectCount}
          </span>
          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            {summary.activeProjectCount} {DASHBOARD_TEXT.STATS_ACTIVE}
          </span>
        </div>
      </div>

      {/* API Collections Card */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
            {DASHBOARD_TEXT.STATS_ENDPOINTS}
          </span>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
            {totalApisCount}
          </span>
          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-semibold font-mono">
            {summary.activeEndpointCount} {DASHBOARD_TEXT.STATS_ACTIVE}
          </span>
        </div>
      </div>

      {/* Scenarios Card */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
            {DASHBOARD_TEXT.STATS_SCENARIOS}
          </span>
          <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20">
            <FileCode className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
            {summary.requestScenarioCount}
          </span>
          <span className="ml-2 text-xs text-fuchsia-500 font-semibold font-mono">
            {summary.responseScenarioCount} {DASHBOARD_TEXT.STATS_RESPS}
          </span>
        </div>
      </div>
    </div>
  );
};