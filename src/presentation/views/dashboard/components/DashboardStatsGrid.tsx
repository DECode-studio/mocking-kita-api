'use client';

import React from 'react';
import { FolderGit2, Globe, Layers, FileCode } from 'lucide-react';
import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';
import { Project } from '@/src/domain/project/entity/project';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { DASHBOARD_TEXT, DASHBOARD_SEMANTIC_ID } from '../constant';

interface DashboardStatsGridProps {
  db: MockApiDatabase;
  activeProjects: Project[];
  activeApis: ApiCollection[];
  totalApisCount: number;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  db,
  activeProjects,
  activeApis,
  totalApisCount,
}) => {
  return (
    <div id={DASHBOARD_SEMANTIC_ID.STATS_GRID} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {db.projects.filter((p) => !p.deletedAt).length}
          </span>
          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            {activeProjects.length} {DASHBOARD_TEXT.STATS_ACTIVE}
          </span>
        </div>
      </div>

      {/* Environments Card */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
            {DASHBOARD_TEXT.STATS_ENVIRONMENTS}
          </span>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
            {db.environments.filter((e) => !e.deletedAt).length}
          </span>
          <span className="ml-2 text-xs text-slate-500 font-medium font-mono">{DASHBOARD_TEXT.STATS_CONFIGURED}</span>
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
            {activeApis.length} {DASHBOARD_TEXT.STATS_ACTIVE}
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
            {db.requestScenarios.filter((r) => !r.deletedAt).length}
          </span>
          <span className="ml-2 text-xs text-fuchsia-500 font-semibold font-mono">
            {db.responseScenarios.filter((r) => !r.deletedAt).length} {DASHBOARD_TEXT.STATS_RESPS}
          </span>
        </div>
      </div>
    </div>
  );
};
