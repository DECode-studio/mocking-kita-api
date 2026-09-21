import React from 'react';
import { Layers } from 'lucide-react';
import { BodyPathRule, RequestBodyType } from '@/src/core/utils/types';
import { KeyValueOrJsonEditor } from '@/src/client/presentation/views/api-detail/components/KeyValueOrJsonEditor';
import { BodyPathRulesEditor } from '@/src/client/presentation/views/api-detail/components/BodyPathRulesEditor';
import { DataSheetVariablePicker } from '@/src/client/presentation/components/shared/DataSheetVariablePicker';
import { EnvironmentVariablePicker } from '@/src/client/presentation/components/shared/EnvironmentVariablePicker';
import {
  REQUEST_SCENARIO_EDITOR_TEXT,
  REQUEST_SCENARIO_EDITOR_SEMANTIC_ID,
} from '../constant';

interface RequestScenarioBodyCardProps {
  projectId?: string;
  body: string;
  onBodyChange: (value: string) => void;
  bodyType: RequestBodyType;
  onBodyTypeChange: (value: RequestBodyType) => void;
  bodyRules: BodyPathRule[];
  onBodyRulesChange: (rules: BodyPathRule[]) => void;
  strictBodyStructure?: boolean;
  onStrictBodyStructureChange?: (strict: boolean) => void;
}

export const RequestScenarioBodyCard: React.FC<RequestScenarioBodyCardProps> = ({
  projectId,
  body,
  onBodyChange,
  bodyType,
  onBodyTypeChange,
  bodyRules,
  onBodyRulesChange,
  strictBodyStructure,
  onStrictBodyStructureChange,
}) => {
  const cleanTokenKey = (token: string, fallback: string) =>
    token
      .replace(/^\{\{\s*(?:datasheet\.|env\.)?/, '')
      .replace(/\}\}.*$/, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || fallback;

  const handleInsertBodyToken = (token: string) => {
    try {
      const parsed = JSON.parse(body.trim() || '{}');
      const key = cleanTokenKey(token, 'field');
      parsed[key] = token;
      onBodyChange(JSON.stringify(parsed, null, 2));
    } catch {
      onBodyChange(body ? `${body}\n"${token}"` : token);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {REQUEST_SCENARIO_EDITOR_TEXT.BODY_TITLE}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <EnvironmentVariablePicker
            projectId={projectId}
            buttonLabel="Env Vars"
            onInsert={handleInsertBodyToken}
          />
          <DataSheetVariablePicker
            buttonLabel="Data Sheets"
            onInsert={handleInsertBodyToken}
          />
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
              {REQUEST_SCENARIO_EDITOR_TEXT.BODY_TYPE_LABEL}
            </label>
            <select
              id={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.SELECT_BODY_TYPE}
              value={bodyType}
              onChange={(e) => onBodyTypeChange(e.target.value as RequestBodyType)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
            >
              <option value="JSON">JSON (application/json)</option>
              <option value="FORM_DATA">Form Data (multipart/form-data)</option>
              <option value="URL_ENCODED">URL Encoded (application/x-www-form-urlencoded)</option>
              <option value="NONE">None (No Request Body)</option>
            </select>
          </div>
        </div>
      </div>

      {bodyType === 'NONE' ? (
        <div className="py-6 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
          {REQUEST_SCENARIO_EDITOR_TEXT.BODY_NONE_NOTICE}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Full Body Payload Editor */}
          <div className="space-y-2">
            <KeyValueOrJsonEditor
              projectId={projectId}
              label={
                bodyType === 'JSON'
                  ? 'Full Body Payload Matching (JSON)'
                  : bodyType === 'FORM_DATA'
                  ? 'Body Fields & Files Matching (JSON Object)'
                  : 'Body Fields Matching (JSON Object)'
              }
              value={body}
              onChange={onBodyChange}
              supportFiles={bodyType === 'FORM_DATA'}
              placeholderValue="Expected Value"
              idPrefix={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.BODY_EDITOR}
            />
          </div>

          {/* Body Path Rules (Dot-Notation Matcher) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <BodyPathRulesEditor
              projectId={projectId}
              rules={bodyRules}
              onChange={onBodyRulesChange}
              bodyContent={body}
              strictBodyStructure={strictBodyStructure}
              onStrictBodyStructureChange={onStrictBodyStructureChange}
              idPrefix={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.BODY_RULES_EDITOR}
            />
          </div>
        </div>
      )}
    </div>
  );
};
