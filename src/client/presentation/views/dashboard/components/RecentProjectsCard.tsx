'use client';


import React from 'react';
import { ArrowRight, Code2 } from 'lucide-react';
import { DashboardProjectSummary } from '@/src/client/domain/dashboard/entity/dashboard_summary';
import { StatusBadge } from '@/src/client/presentation/components/shared/StatusBadge';
import { formatDate } from '@/src/core/utils/date';
import { DASHBOARD_TEXT, DASHBOARD_SEMANTIC_ID } from '../constant';

interface RecentProjectsCardProps {
  projects: DashboardProjectSummary[];
  onNavigateViewAll: () => void;
  onNavigateProject: (projectId: string) => void;
}

export const RecentProjectsCard: React.FC<RecentProjectsCardProps> = ({
  projects,
  onNavigateViewAll,
  onNavigateProject,
}) => {
  return (
    <div id={DASHBOARD_SEMANTIC_ID.RECENT_PROJECTS} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {DASHBOARD_TEXT.RECENT_PROJECTS_TITLE}
        </h3>
        <button
          type="button"
          onClick={onNavigateViewAll}
          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
        >
          {DASHBOARD_TEXT.VIEW_ALL} <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onNavigateProject(project.id)}
              className="p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block truncate">
                    {project.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDate(project.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-slate-500">
                  {project.apiCount} APIs
                </span>
                <StatusBadge status={project.status} />
              </div>
            </div>
        ))}
      </div>
    </div>
  );
};