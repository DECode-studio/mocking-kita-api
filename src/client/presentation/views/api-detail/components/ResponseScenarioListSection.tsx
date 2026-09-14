'use client';


import React from 'react';
import { Plus, Edit2, Copy, Trash2 } from 'lucide-react';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { StatusBadge } from '@/src/client/presentation/components/shared/StatusBadge';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ResponseScenarioListSectionProps {
  respScenarios: ResponseScenario[];
  onAddClick: () => void;
  onEdit: (resp: ResponseScenario) => void;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onUpdateScenario?: any;
}

export const ResponseScenarioListSection: React.FC<ResponseScenarioListSectionProps> = ({
  respScenarios,
  onAddClick,
  onEdit,
  onDuplicate,
  onDeleteRequest,
  onToggleStatus,
}) => {
  return (
    <div id={API_DETAIL_SEMANTIC_ID.RESPONSES_SECTION} className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {API_DETAIL_TEXT.RESPONSES_TITLE} ({respScenarios.length})
        </h4>
        <button
          id={API_DETAIL_SEMANTIC_ID.RESPONSES_ADD_BTN}
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> {API_DETAIL_TEXT.RESPONSES_ADD_BTN}
        </button>
      </div>

      <div className="space-y-3">
        {respScenarios.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            No response scenarios configured. Add a response payload (e.g. 200 OK, 400 Bad Request, 500 Error).
          </p>
        ) : (
          respScenarios.map((resp) => (
            <div
              key={resp.id}
              className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      resp.statusCode >= 200 && resp.statusCode < 300
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : resp.statusCode >= 400 && resp.statusCode < 500
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    HTTP {resp.statusCode}
                  </span>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{resp.name}</span>
                  <StatusBadge status={resp.status} />
                </div>

                <div className="flex items-center gap-2">
                  <StatusSwitch
                    checked={resp.status}
                    onCheckedChange={() => onToggleStatus(resp.id)}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => onEdit(resp)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Edit Response"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(resp.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Duplicate Response"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(resp.id)}
                    className="p-1 text-rose-500 hover:text-rose-700"
                    title="Delete Response"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {resp.delayMs > 0 && (
                <div className="text-[11px] font-mono text-slate-400">
                  Delay: <span className="text-slate-700 dark:text-slate-300 font-semibold">{resp.delayMs} ms</span>
                </div>
              )}

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed">
                <pre>{typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body || {}, null, 2)}</pre>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};