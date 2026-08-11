'use client';

import React from 'react';
import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { HttpMethodBadge } from '@/src/presentation/components/shared/HttpMethodBadge';
import { StatusBadge } from '@/src/presentation/components/shared/StatusBadge';
import { DASHBOARD_TEXT, DASHBOARD_SEMANTIC_ID } from '../constant';

interface ConfiguredEndpointsCardProps {
  db: MockApiDatabase;
  activeApis: ApiCollection[];
  onNavigateApiDetail: (projectId: string, apiId: string) => void;
}

export const ConfiguredEndpointsCard: React.FC<ConfiguredEndpointsCardProps> = ({
  db,
  activeApis,
  onNavigateApiDetail,
}) => {
  return (
    <div id={DASHBOARD_SEMANTIC_ID.CONFIGURED_ENDPOINTS} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {DASHBOARD_TEXT.CONFIGURED_ENDPOINTS_TITLE}
        </h3>
        <span className="text-xs font-mono text-slate-500">
          Showing {activeApis.slice(0, 5).length} of {activeApis.length}
        </span>
      </div>

      <div className="space-y-3">
        {activeApis.slice(0, 5).map((api) => {
          const reqCount = db.requestScenarios.filter(
            (r) => r.apiId === api.id && !r.deletedAt
          ).length;

          return (
            <div
              key={api.id}
              onClick={() => onNavigateApiDetail(api.projectId, api.id)}
              className="p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <HttpMethodBadge method={api.methodRequest} size="sm" />
                <div className="truncate">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 block truncate">
                    {api.path}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {api.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {reqCount} rules
                </span>
                <StatusBadge status={api.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
