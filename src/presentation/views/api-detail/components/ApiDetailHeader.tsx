'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { Project } from '@/src/domain/project/entity/project';
import { HttpMethodBadge } from '@/src/presentation/components/shared/HttpMethodBadge';
import { StatusBadge } from '@/src/presentation/components/shared/StatusBadge';
import { StatusSwitch } from '@/src/presentation/components/shared/StatusSwitch';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';

interface ApiDetailHeaderProps {
  api: ApiCollection;
  project: Project;
  onBack: () => void;
  onToggleStatus: (id: string) => void;
}

export const ApiDetailHeader: React.FC<ApiDetailHeaderProps> = ({
  api,
  project,
  onBack,
  onToggleStatus,
}) => {
  return (
    <div id={API_DETAIL_SEMANTIC_ID.HEADER} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div className="space-y-1">
        <button
          id={API_DETAIL_SEMANTIC_ID.BACK_BTN}
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {API_DETAIL_TEXT.BACK_TO_PREFIX} {project.name}
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <HttpMethodBadge method={api.methodRequest} size="lg" />
          <h1 className="text-xl font-mono font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {api.path}
          </h1>
          <StatusBadge status={api.status} />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {api.name} {api.description ? `• ${api.description}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <StatusSwitch
          checked={api.status}
          onCheckedChange={() => onToggleStatus(api.id)}
          label={api.status ? API_DETAIL_TEXT.STATUS_API_ACTIVE : API_DETAIL_TEXT.STATUS_API_DISABLED}
        />
      </div>
    </div>
  );
};
