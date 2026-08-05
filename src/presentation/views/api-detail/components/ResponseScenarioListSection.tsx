'use client';

import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, Edit2, Copy, Trash2 } from 'lucide-react';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { StatusCodeBadge } from '@/src/presentation/components/shared/StatusCodeBadge';
import { StatusSwitch } from '@/src/presentation/components/shared/StatusSwitch';
import { KeyValueEditor } from './KeyValueEditor';
import { JsonEditor } from './JsonEditor';

interface ResponseScenarioListSectionProps {
  respScenarios: ResponseScenario[];
  onAddClick: () => void;
  onEdit: (resp: ResponseScenario) => void;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onUpdateScenario: (id: string, partial: Partial<ResponseScenario>) => Promise<void>;
}

export const ResponseScenarioListSection: React.FC<ResponseScenarioListSectionProps> = ({
  respScenarios,
  onAddClick,
  onEdit,
  onDuplicate,
  onDeleteRequest,
  onToggleStatus,
  onUpdateScenario,
}) => {
  return (
    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Mock Responses ({respScenarios.length})
          </h3>
          <p className="text-[11px] text-slate-500">
            Multiple weighted or prioritized response payoffs for this request match
          </p>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Response
        </button>
      </div>

      {respScenarios.length === 0 ? (
        <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center">
          <p className="text-xs text-slate-500">No mock responses configured for this scenario.</p>
          <button
            type="button"
            onClick={onAddClick}
            className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
          >
            Add response scenario
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {respScenarios.map((resp) => (
            <div
              key={resp.id}
              className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusCodeBadge code={resp.statusCode} />
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {resp.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500">{resp.description || 'No description'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                    Delay: {resp.delayMs}ms
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                    Weight: {resp.weight}%
                  </span>
                  <StatusSwitch
                    checked={resp.status}
                    onCheckedChange={() => onToggleStatus(resp.id)}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => onEdit(resp)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(resp.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(resp.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <Tabs.Root defaultValue="preview" className="space-y-2">
                <Tabs.List className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-[11px] font-medium">
                  <Tabs.Trigger
                    value="preview"
                    className="pb-1 text-slate-500 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b"
                  >
                    Preview Response
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="body"
                    className="pb-1 text-slate-500 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b"
                  >
                    Edit Body
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="headers"
                    className="pb-1 text-slate-500 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b"
                  >
                    Edit Headers
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="preview">
                  <div className="p-3 bg-slate-950 text-slate-100 rounded-lg font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
                      <span>HTTP/1.1 {resp.statusCode}</span>
                      <span>Simulated Delay: {resp.delayMs}ms</span>
                    </div>
                    <pre className="text-emerald-400 overflow-x-auto max-h-48 leading-relaxed">
                      {JSON.stringify(resp.body ?? {}, null, 2)}
                    </pre>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="body">
                  <JsonEditor
                    value={resp.body ?? {}}
                    onChange={(val) => onUpdateScenario(resp.id, { body: val })}
                    rows={6}
                  />
                </Tabs.Content>

                <Tabs.Content value="headers">
                  <KeyValueEditor
                    title="Response Headers"
                    value={resp.headers ?? {}}
                    onChange={(val) => onUpdateScenario(resp.id, { headers: val })}
                  />
                </Tabs.Content>
              </Tabs.Root>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
