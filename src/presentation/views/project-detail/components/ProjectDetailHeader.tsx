'use client';

import React from 'react';
import { ArrowLeft, FileJson, Trash2 } from 'lucide-react';
import { Project } from '@/src/domain/project/entity/project';
import { StatusBadge } from '@/src/presentation/components/shared/StatusBadge';
import { StatusSwitch } from '@/src/presentation/components/shared/StatusSwitch';
import { PROJECT_DETAIL_TEXT, PROJECT_DETAIL_SEMANTIC_ID } from '../constant';

interface ProjectDetailHeaderProps {
  project: Project;
  onBack: () => void;
  onToggleStatus: (id: string) => void;
  onSoftDelete: () => void;
  onOpenApiClick?: () => void;
}

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({
  project,
  onBack,
  onToggleStatus,
  onSoftDelete,
  onOpenApiClick,
}) => {
  return (
    <div id={PROJECT_DETAIL_SEMANTIC_ID.HEADER} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div className="space-y-1">
        <button
          id={PROJECT_DETAIL_SEMANTIC_ID.BACK_BTN}
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {PROJECT_DETAIL_TEXT.BACK_TO_PROJECTS}
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {project.name}
          </h1>
          <StatusBadge status={project.status} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {project.description || PROJECT_DETAIL_TEXT.NO_DESCRIPTION}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {onOpenApiClick && (
          <button
            type="button"
            onClick={onOpenApiClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 rounded-lg transition-colors"
            title="Export / Import OpenAPI JSON"
          >
            <FileJson className="w-3.5 h-3.5" />
            {PROJECT_DETAIL_TEXT.EXPORT_IMPORT_JSON_BTN}
          </button>
        )}
        <StatusSwitch
          checked={project.status}
          onCheckedChange={() => onToggleStatus(project.id)}
          label={project.status ? PROJECT_DETAIL_TEXT.STATUS_ACTIVE : PROJECT_DETAIL_TEXT.STATUS_DISABLED}
        />
        <button
          id={PROJECT_DETAIL_SEMANTIC_ID.DELETE_BTN}
          type="button"
          onClick={onSoftDelete}
          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          title={PROJECT_DETAIL_TEXT.TITLE_DELETE_PROJECT}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
