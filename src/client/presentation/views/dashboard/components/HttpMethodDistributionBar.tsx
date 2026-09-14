'use client';


import React from 'react';
import { DASHBOARD_TEXT, DASHBOARD_SEMANTIC_ID } from '../constant';

interface HttpMethodDistributionBarProps {
  totalApisCount: number;
  methodCounts: Record<string, number>;
}

export const HttpMethodDistributionBar: React.FC<HttpMethodDistributionBarProps> = ({
  totalApisCount,
  methodCounts,
}) => {
  if (totalApisCount === 0) return null;

  return (
    <div id={DASHBOARD_SEMANTIC_ID.DISTRIBUTION_BAR} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          {DASHBOARD_TEXT.HTTP_DISTRIBUTION_TITLE}
        </h3>
        <span className="text-xs font-mono text-slate-500">
          {totalApisCount} {DASHBOARD_TEXT.HTTP_ENDPOINTS_TOTAL}
        </span>
      </div>

      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
        {methodCounts.GET > 0 && (
          <div
            style={{ width: `${(methodCounts.GET / totalApisCount) * 100}%` }}
            className="bg-emerald-500 transition-all"
            title={`GET: ${methodCounts.GET}`}
          />
        )}
        {methodCounts.POST > 0 && (
          <div
            style={{ width: `${(methodCounts.POST / totalApisCount) * 100}%` }}
            className="bg-sky-500 transition-all"
            title={`POST: ${methodCounts.POST}`}
          />
        )}
        {methodCounts.PUT > 0 && (
          <div
            style={{ width: `${(methodCounts.PUT / totalApisCount) * 100}%` }}
            className="bg-amber-500 transition-all"
            title={`PUT: ${methodCounts.PUT}`}
          />
        )}
        {methodCounts.PATCH > 0 && (
          <div
            style={{ width: `${(methodCounts.PATCH / totalApisCount) * 100}%` }}
            className="bg-purple-500 transition-all"
            title={`PATCH: ${methodCounts.PATCH}`}
          />
        )}
        {methodCounts.DELETE > 0 && (
          <div
            style={{ width: `${(methodCounts.DELETE / totalApisCount) * 100}%` }}
            className="bg-rose-500 transition-all"
            title={`DELETE: ${methodCounts.DELETE}`}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> GET ({methodCounts.GET})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500" /> POST ({methodCounts.POST})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> PUT ({methodCounts.PUT})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> PATCH ({methodCounts.PATCH})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> DELETE ({methodCounts.DELETE})
        </span>
      </div>
    </div>
  );
};