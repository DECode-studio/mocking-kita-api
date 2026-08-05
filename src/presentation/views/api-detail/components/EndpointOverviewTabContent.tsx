'use client';

import React from 'react';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { Project } from '@/src/domain/project/entity/project';
import { HttpMethodBadge } from '@/src/presentation/components/shared/HttpMethodBadge';

interface EndpointOverviewTabContentProps {
  api: ApiCollection;
  project: Project;
}

export const EndpointOverviewTabContent: React.FC<EndpointOverviewTabContentProps> = ({
  api,
  project,
}) => {
  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 max-w-xl">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Endpoint Details
      </h3>
      <div className="space-y-2.5 text-xs font-mono">
        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400">Endpoint ID</span>
          <span className="text-slate-800 dark:text-slate-200">{api.id}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400">HTTP Method</span>
          <HttpMethodBadge method={api.methodRequest} size="sm" />
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400">Path</span>
          <span className="text-slate-800 dark:text-slate-200">{api.path}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400">Project</span>
          <span className="text-slate-800 dark:text-slate-200">{project.name}</span>
        </div>
      </div>
    </div>
  );
};
