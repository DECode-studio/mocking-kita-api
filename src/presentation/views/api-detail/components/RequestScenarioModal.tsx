'use client';

import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Sparkles, Plus, Trash2 } from 'lucide-react';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { RequestBodyType } from '@/src/core/utils/types';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';
import { formatJsonString } from '@/src/core/utils/json';

type KeyValueRow = {
  key: string;
  value: string;
  isFile: boolean;
};

interface KeyValueOrJsonEditorProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  supportFiles?: boolean;
  placeholderValue?: string;
}

const KeyValueOrJsonEditor: React.FC<KeyValueOrJsonEditorProps> = ({
  label,
  value,
  onChange,
  supportFiles = false,
  placeholderValue = 'Value',
}) => {
  const [mode, setMode] = useState<'raw' | 'key-value'>('key-value');
  const [rows, setRows] = useState<KeyValueRow[]>([]);

  // Helper to convert JSON string to rows
  const syncJsonToRows = (jsonStr: string) => {
    try {
      const obj = JSON.parse(jsonStr);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const parsedRows = Object.entries(obj).map(([k, v]) => {
          if (supportFiles && v && typeof v === 'object' && 'filename' in v) {
            return { key: k, value: String((v as any).filename || ''), isFile: true };
          }
          return { key: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v), isFile: false };
        });
        setRows(parsedRows.length > 0 ? parsedRows : [{ key: '', value: '', isFile: false }]);
        return;
      }
    } catch {}
    setRows([{ key: '', value: '', isFile: false }]);
  };

  // Convert current rows to JSON string
  const rowsToJson = (targetRows: KeyValueRow[]): string => {
    const obj: Record<string, any> = {};
    for (const row of targetRows) {
      if (!row.key.trim()) continue;
      if (supportFiles && row.isFile) {
        obj[row.key] = { filename: row.value };
      } else {
        const trimmedVal = row.value.trim();
        if (trimmedVal === 'true') {
          obj[row.key] = true;
        } else if (trimmedVal === 'false') {
          obj[row.key] = false;
        } else if (trimmedVal !== '' && !isNaN(Number(trimmedVal))) {
          obj[row.key] = Number(trimmedVal);
        } else {
          try {
            if ((trimmedVal.startsWith('{') && trimmedVal.endsWith('}')) || (trimmedVal.startsWith('[') && trimmedVal.endsWith(']'))) {
              obj[row.key] = JSON.parse(trimmedVal);
            } else {
              obj[row.key] = row.value;
            }
          } catch {
            obj[row.key] = row.value;
          }
        }
      }
    }
    return JSON.stringify(obj, null, 2);
  };

  // Synchronize rows when value changes from outside (e.g. on modal open)
  useEffect(() => {
    if (mode === 'key-value') {
      syncJsonToRows(value);
    }
  }, [value, mode]);

  const handleModeChange = (newMode: 'raw' | 'key-value') => {
    if (newMode === 'key-value') {
      syncJsonToRows(value);
    }
    setMode(newMode);
  };

  const updateRow = (index: number, updatedFields: Partial<KeyValueRow>) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], ...updatedFields };
    setRows(updatedRows);
    onChange(rowsToJson(updatedRows));
  };

  const addRow = () => {
    const updatedRows = [...rows, { key: '', value: '', isFile: false }];
    setRows(updatedRows);
  };

  const deleteRow = (index: number) => {
    let updatedRows = rows.filter((_, i) => i !== index);
    if (updatedRows.length === 0) {
      updatedRows = [{ key: '', value: '', isFile: false }];
    }
    setRows(updatedRows);
    onChange(rowsToJson(updatedRows));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {mode === 'raw' && (
            <button
              type="button"
              onClick={() => onChange(formatJsonString(value))}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline mr-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              Beautify
            </button>
          )}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-950 text-[10px]">
            <button
              type="button"
              onClick={() => handleModeChange('key-value')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                mode === 'key-value'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Key-Value
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('raw')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                mode === 'raw'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Raw JSON
            </button>
          </div>
        </div>
      </div>

      {mode === 'raw' ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`e.g. { "id": 123 }`}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
        />
      ) : (
        <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50/50 dark:bg-slate-950/20 max-h-40 overflow-y-auto">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={row.key}
                onChange={(e) => updateRow(index, { key: e.target.value })}
                placeholder="Key"
                className="w-1/3 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <input
                type="text"
                value={row.value}
                onChange={(e) => updateRow(index, { value: e.target.value })}
                placeholder={row.isFile ? 'File name pattern (e.g. avatar.png)' : placeholderValue}
                className="flex-1 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              {supportFiles && (
                <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={row.isFile}
                    onChange={(e) => updateRow(index, { isFile: e.target.checked })}
                    className="w-3 h-3 text-indigo-600 rounded border-slate-300"
                  />
                  <span>File?</span>
                </label>
              )}
              <button
                type="button"
                onClick={() => deleteRow(index)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Remove Row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
      )}
    </div>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
interface RequestScenarioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingReqScenario: RequestScenario | null;
  onSubmit: (data: {
    name: string;
    priority: number;
    queryParams: string;
    headers: string;
    body: string;
    bodyType: RequestBodyType;
    status: boolean;
  }) => void;
}

export const RequestScenarioModal: React.FC<RequestScenarioModalProps> = ({
  isOpen,
  onOpenChange,
  editingReqScenario,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState(1);
  const [queryParams, setQueryParams] = useState('{}');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [bodyType, setBodyType] = useState<RequestBodyType>('JSON');
  const [status, setStatus] = useState(true);

  useEffect(() => {
    if (editingReqScenario) {
      setName(editingReqScenario.name);
      setPriority(editingReqScenario.priority || 1);
      setQueryParams(JSON.stringify(editingReqScenario.queryParams || {}, null, 2));
      setHeaders(JSON.stringify(editingReqScenario.headers || {}, null, 2));
      setBody(typeof editingReqScenario.body === 'string' ? editingReqScenario.body : JSON.stringify(editingReqScenario.body || {}, null, 2));
      setBodyType(editingReqScenario.bodyType || 'JSON');
      setStatus(editingReqScenario.status);
    } else {
      setName('');
      setPriority(1);
      setQueryParams('{}');
      setHeaders('{}');
      setBody('{}');
      setBodyType('JSON');
      setStatus(true);
    }
  }, [editingReqScenario, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      priority: Number(priority) || 1,
      queryParams,
      headers,
      body: bodyType === 'NONE' ? '{}' : body,
      bodyType,
      status,
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
        <Dialog.Content id={API_DETAIL_SEMANTIC_ID.REQ_MODAL} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingReqScenario ? API_DETAIL_TEXT.MODAL_REQ_EDIT_TITLE : API_DETAIL_TEXT.MODAL_REQ_ADD_TITLE}
            </Dialog.Title>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {API_DETAIL_TEXT.LABEL_SCENARIO_NAME}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Valid VIP Customer Request"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {API_DETAIL_TEXT.LABEL_PRIORITY}
                </label>
                <input
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                />
              </div>
            </div>

            <KeyValueOrJsonEditor
              label="Query Params Matching"
              value={queryParams}
              onChange={setQueryParams}
              placeholderValue="Value"
            />

            <KeyValueOrJsonEditor
              label="Headers Matching"
              value={headers}
              onChange={setHeaders}
              placeholderValue="Value"
            />

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Request Body Type
              </label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as RequestBodyType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="JSON">JSON (application/json)</option>
                <option value="FORM_DATA">Form Data (multipart/form-data)</option>
                <option value="URL_ENCODED">URL Encoded (application/x-www-form-urlencoded)</option>
                <option value="NONE">None (No Request Body)</option>
              </select>
            </div>

            {bodyType !== 'NONE' && (
              <KeyValueOrJsonEditor
                label={
                  bodyType === 'JSON'
                    ? 'Body Payload Matching (JSON)'
                    : bodyType === 'FORM_DATA'
                    ? 'Body Fields & Files Matching (JSON Object)'
                    : 'Body Fields Matching (JSON Object)'
                }
                value={body}
                onChange={setBody}
                supportFiles={bodyType === 'FORM_DATA'}
                placeholderValue="Value"
              />
            )}

            <div className="flex items-center justify-between pt-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">{API_DETAIL_TEXT.LABEL_ACTIVE_STATUS}</label>
              <input
                type="checkbox"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
              >
                {API_DETAIL_TEXT.BTN_CANCEL}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-xs transition-colors"
              >
                {editingReqScenario ? API_DETAIL_TEXT.BTN_SAVE : API_DETAIL_TEXT.BTN_CREATE}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
