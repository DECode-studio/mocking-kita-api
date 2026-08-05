'use client';

import React from 'react';
import { Edit2 } from 'lucide-react';
import { Project } from '@/src/domain/project/entity/project';
import { StatusBadge } from '@/src/presentation/components/shared/StatusBadge';
import { formatDate } from '@/src/core/utils/date';
import { PROJECTS_TEXT, PROJECTS_SEMANTIC_ID } from '../constant';

interface ProjectTableViewProps {
  projects: Project[];
  onNavigateDetail: (id: string) => void;
  onEdit: (project: Project) => void;
}

export const ProjectTableView: React.FC<ProjectTableViewProps> = ({
  projects,
  onNavigateDetail,
  onEdit,
}) => {
  return (
    <div id={PROJECTS_SEMANTIC_ID.PROJECT_TABLE} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="p-3.5">{PROJECTS_TEXT.TABLE_COL_NAME}</th>
            <th className="p-3.5">{PROJECTS_TEXT.TABLE_COL_STATUS}</th>
            <th className="p-3.5">{PROJECTS_TEXT.TABLE_COL_CREATED}</th>
            <th className="p-3.5 text-right">{PROJECTS_TEXT.TABLE_COL_ACTIONS}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
              <td className="p-3.5">
                <span
                  onClick={() => onNavigateDetail(project.id)}
                  className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer block"
                >
                  {project.name}
                </span>
                <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                  {project.description || 'No description'}
                </span>
              </td>
              <td className="p-3.5">
                <StatusBadge status={project.status} />
              </td>
              <td className="p-3.5 font-mono text-slate-500">{formatDate(project.createdAt)}</td>
              <td className="p-3.5 text-right space-x-2">
                <button
                  type="button"
                  onClick={() => onNavigateDetail(project.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 rounded hover:bg-indigo-100 transition-colors"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5 inline" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
