import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { KeyValueOrJsonEditor } from '@/src/client/presentation/views/api-detail/components/KeyValueOrJsonEditor';
import { DataSheetVariablePicker } from '@/src/client/presentation/components/shared/DataSheetVariablePicker';
import { EnvironmentVariablePicker } from '@/src/client/presentation/components/shared/EnvironmentVariablePicker';
import {
  REQUEST_SCENARIO_EDITOR_TEXT,
  REQUEST_SCENARIO_EDITOR_SEMANTIC_ID,
} from '../constant';

interface RequestScenarioParamsCardProps {
  projectId?: string;
  queryParams: string;
  onQueryParamsChange: (value: string) => void;
  headers: string;
  onHeadersChange: (value: string) => void;
}

export const RequestScenarioParamsCard: React.FC<RequestScenarioParamsCardProps> = ({
  projectId,
  queryParams,
  onQueryParamsChange,
  headers,
  onHeadersChange,
}) => {
  const cleanTokenKey = (token: string, fallback: string) =>
    token
      .replace(/^\{\{\s*(?:datasheet\.|env\.)?/, '')
      .replace(/\}\}.*$/, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || fallback;

  const handleInsertQueryParamToken = (token: string) => {
    try {
      const parsed = JSON.parse(queryParams.trim() || '{}');
      const key = cleanTokenKey(token, 'param');
      parsed[key] = token;
      onQueryParamsChange(JSON.stringify(parsed, null, 2));
    } catch {
      onQueryParamsChange(queryParams ? `${queryParams}\n"${token}"` : token);
    }
  };

  const handleInsertHeaderToken = (token: string) => {
    try {
      const parsed = JSON.parse(headers.trim() || '{}');
      const key = cleanTokenKey(token, 'header');
      parsed[key] = token;
      onHeadersChange(JSON.stringify(parsed, null, 2));
    } catch {
      onHeadersChange(headers ? `${headers}\n"${token}"` : token);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Query Params Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {REQUEST_SCENARIO_EDITOR_TEXT.QUERY_PARAMS_TITLE}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <EnvironmentVariablePicker
              projectId={projectId}
              buttonLabel="Env Vars"
              onInsert={handleInsertQueryParamToken}
            />
            <DataSheetVariablePicker
              buttonLabel="Data Sheets"
              onInsert={handleInsertQueryParamToken}
            />
          </div>
        </div>
        <KeyValueOrJsonEditor
          projectId={projectId}
          label="Query Params"
          value={queryParams}
          onChange={onQueryParamsChange}
          placeholderValue="Expected Value"
          idPrefix={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.QUERY_EDITOR}
        />
      </div>

      {/* Headers Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {REQUEST_SCENARIO_EDITOR_TEXT.HEADERS_TITLE}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <EnvironmentVariablePicker
              projectId={projectId}
              buttonLabel="Env Vars"
              onInsert={handleInsertHeaderToken}
            />
            <DataSheetVariablePicker
              buttonLabel="Data Sheets"
              onInsert={handleInsertHeaderToken}
            />
          </div>
        </div>
        <KeyValueOrJsonEditor
          projectId={projectId}
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

