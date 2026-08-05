'use client';

import React from 'react';
import { Edit2, Copy, Trash2 } from 'lucide-react';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { StatusBadge } from '@/src/presentation/components/shared/StatusBadge';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface RequestScenarioDetailPanelProps {
  scenario: RequestScenario;
  onEdit: () => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
  onUpdateScenario?: any;
  children?: React.ReactNode;
}

export const RequestScenarioDetailPanel: React.FC<RequestScenarioDetailPanelProps> = ({
  scenario,
  onEdit,
  onDuplicate,
  onDeleteRequest,
  children,
}) => {
  return (
    <div id={API_DETAIL_SEMANTIC_ID.SCENARIO_DETAIL} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{scenario.name}</h3>
            <StatusBadge status={scenario.status} />
          </div>
          <p className="text-xs text-slate-500 font-mono">
            {API_DETAIL_TEXT.DETAIL_RULE_WEIGHT}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{scenario.priority}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Rule
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
            title="Duplicate Rule"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDeleteRequest}
            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg"
            title="Delete Rule"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 font-mono">
            {API_DETAIL_TEXT.DETAIL_PARAM_MATCHING}
          </h4>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200">
            <pre>{JSON.stringify(scenario.queryParams || {}, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 font-mono">
            {API_DETAIL_TEXT.DETAIL_HEADER_MATCHING}
          </h4>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200">
            <pre>{JSON.stringify(scenario.headers || {}, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 font-mono">
            {API_DETAIL_TEXT.DETAIL_BODY_MATCHING}
          </h4>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200">
            <pre>{typeof scenario.body === 'string' ? scenario.body : JSON.stringify(scenario.body || {}, null, 2)}</pre>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
};
