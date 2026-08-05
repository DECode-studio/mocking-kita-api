'use client';

import React from 'react';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { Project } from '@/src/domain/project/entity/project';
import { HttpMethodBadge } from '@/src/presentation/components/shared/HttpMethodBadge';
import { StatusBadge } from '@/src/presentation/components/shared/StatusBadge';
import { formatDate } from '@/src/core/utils/date';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';

interface EndpointOverviewTabContentProps {
  api: ApiCollection;
  project: Project;
}

export const EndpointOverviewTabContent: React.FC<EndpointOverviewTabContentProps> = ({
  api,
  project,
}) => {
  return (
    <div id={API_DETAIL_SEMANTIC_ID.OVERVIEW_TAB_CONTENT} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-6 max-w-3xl">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{API_DETAIL_TEXT.TAB_OVERVIEW}</h3>
        <p className="text-xs text-slate-500">System attributes and configuration parameters for this API endpoint.</p>
      </div>

      <div className="space-y-3 text-xs font-mono">
        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 font-sans">{API_DETAIL_TEXT.OVERVIEW_PROJECT_ID}</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">{project.name} ({project.id})</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 font-sans">{API_DETAIL_TEXT.OVERVIEW_ENDPOINT_ID}</span>
          <span className="text-slate-800 dark:text-slate-200">{api.id}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 font-sans">{API_DETAIL_TEXT.OVERVIEW_METHOD}</span>
          <HttpMethodBadge method={api.methodRequest} size="sm" />
        </div>
        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 font-sans">{API_DETAIL_TEXT.OVERVIEW_ROUTE}</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{api.path}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 font-sans">Status</span>
          <StatusBadge status={api.status} />
        </div>
        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 font-sans">{API_DETAIL_TEXT.OVERVIEW_CREATED}</span>
          <span className="text-slate-800 dark:text-slate-200">{formatDate(api.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
