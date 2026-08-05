'use client';

import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Edit2, Copy, Trash2 } from 'lucide-react';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { KeyValueEditor } from './KeyValueEditor';
import { JsonEditor } from './JsonEditor';

interface RequestScenarioDetailPanelProps {
  scenario: RequestScenario;
  onEdit: () => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
  onUpdateScenario: (id: string, partial: Partial<RequestScenario>) => Promise<void>;
  children?: React.ReactNode;
}

export const RequestScenarioDetailPanel: React.FC<RequestScenarioDetailPanelProps> = ({
  scenario,
  onEdit,
  onDuplicate,
  onDeleteRequest,
  onUpdateScenario,
  children,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {scenario.name}
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-200 dark:border-indigo-800">
              MATCH: {scenario.matchType}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {scenario.description || 'No description provided.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-md transition-colors"
            title="Edit Scenario Settings"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-md transition-colors"
            title="Duplicate Scenario"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDeleteRequest}
            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
            title="Delete Scenario"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <Tabs.Root defaultValue="headers" className="space-y-3">
        <Tabs.List className="flex border-b border-slate-100 dark:border-slate-800 gap-4 text-xs font-medium">
          <Tabs.Trigger
            value="headers"
            className="pb-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
          >
            Headers ({Object.keys(scenario.headers || {}).length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="queryParams"
            className="pb-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
          >
            Query Params ({Object.keys(scenario.queryParams || {}).length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="pathParams"
            className="pb-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
          >
            Path Params ({Object.keys(scenario.pathParams || {}).length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="body"
            className="pb-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
          >
            Body
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="headers">
          <KeyValueEditor
            title="Expected Request Headers"
            keyPlaceholder="e.g. authorization"
            valuePlaceholder="e.g. Bearer token"
            value={scenario.headers || {}}
            onChange={(val) => onUpdateScenario(scenario.id, { headers: val })}
          />
        </Tabs.Content>

        <Tabs.Content value="queryParams">
          <KeyValueEditor
            title="Expected Query Parameters"
            keyPlaceholder="e.g. includeDetails"
            valuePlaceholder="e.g. true"
            value={scenario.queryParams || {}}
            onChange={(val) => onUpdateScenario(scenario.id, { queryParams: val })}
          />
        </Tabs.Content>

        <Tabs.Content value="pathParams">
          <KeyValueEditor
            title="Expected Path Parameters"
            keyPlaceholder="e.g. id"
            valuePlaceholder="e.g. 123"
            value={scenario.pathParams || {}}
            onChange={(val) => onUpdateScenario(scenario.id, { pathParams: val })}
          />
        </Tabs.Content>

        <Tabs.Content value="body">
          <JsonEditor
            title="Expected Request Body Schema / Payload"
            value={scenario.body || {}}
            onChange={(val) => onUpdateScenario(scenario.id, { body: val })}
            rows={6}
          />
        </Tabs.Content>
      </Tabs.Root>

      {children}
    </div>
  );
};
