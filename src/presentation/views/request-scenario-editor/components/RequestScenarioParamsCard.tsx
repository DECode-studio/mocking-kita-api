'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { KeyValueOrJsonEditor } from '@/src/presentation/views/api-detail/components/KeyValueOrJsonEditor';
import {
  REQUEST_SCENARIO_EDITOR_TEXT,
  REQUEST_SCENARIO_EDITOR_SEMANTIC_ID,
} from '../constant';

interface RequestScenarioParamsCardProps {
  queryParams: string;
  onQueryParamsChange: (value: string) => void;
  headers: string;
  onHeadersChange: (value: string) => void;
}

export const RequestScenarioParamsCard: React.FC<RequestScenarioParamsCardProps> = ({
  queryParams,
  onQueryParamsChange,
  headers,
  onHeadersChange,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Query Params Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {REQUEST_SCENARIO_EDITOR_TEXT.QUERY_PARAMS_TITLE}
          </h2>
        </div>
        <KeyValueOrJsonEditor
          label="Query Params"
          value={queryParams}
          onChange={onQueryParamsChange}
          placeholderValue="Expected Value"
          idPrefix={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.QUERY_EDITOR}
        />
      </div>

      {/* Headers Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {REQUEST_SCENARIO_EDITOR_TEXT.HEADERS_TITLE}
          </h2>
        </div>
        <KeyValueOrJsonEditor
          label="Headers"
          value={headers}
          onChange={onHeadersChange}
          placeholderValue="Expected Value"
          idPrefix={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.HEADERS_EDITOR}
        />
      </div>
    </div>
  );
};

