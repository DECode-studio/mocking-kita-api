'use client';

import React from 'react';
import { Plus, Trash2, Code2, List } from 'lucide-react';
import { useKeyValueEditorViewModel } from '../view_model/useKeyValueEditorViewModel';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface KeyValueEditorProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  title?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  value,
  onChange,
  title = 'Key-Value Pairs',
  keyPlaceholder = 'Key (e.g. Content-Type)',
  valuePlaceholder = 'Value (e.g. application/json)',
}) => {
  const {
    pairs,
    mode,
    rawJsonText,
    jsonError,
    handleAddRow,
    handleRemoveRow,
    handleRowChange,
    handleClearAll,
    handleSwitchToRawJson,
    handleSwitchToTable,
    handleRawJsonChange,
  } = useKeyValueEditorViewModel(value, onChange);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {title}
        </h4>
        <div className="flex items-center gap-2">
          {mode === 'table' ? (
            <button
              type="button"
              onClick={handleSwitchToRawJson}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              Edit as Raw JSON
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSwitchToTable}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 rounded border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <List className="w-3.5 h-3.5" />
              Key-Value Table
            </button>
          )}
          {mode === 'table' && pairs.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {mode === 'table' ? (
        <div className="space-y-2">
          {pairs.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">No key-value entries configured.</p>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Entry
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {pairs.map((pair) => (
                <div key={pair.id} className="flex items-center gap-2 p-2 group hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <input
                    type="checkbox"
                    checked={pair.enabled}
                    onChange={(e) => handleRowChange(pair.id, 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    title="Enable/Disable entry"
                  />
                  <input
                    type="text"
                    value={pair.key}
                    onChange={(e) => handleRowChange(pair.id, 'key', e.target.value)}
                    placeholder={keyPlaceholder}
                    className="flex-1 px-2.5 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => handleRowChange(pair.id, 'value', e.target.value)}
                    placeholder={valuePlaceholder}
                    className="flex-1 px-2.5 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(pair.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Remove entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="p-2 bg-slate-50/50 dark:bg-slate-900/50 flex justify-start">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add another pair
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <textarea
            value={rawJsonText}
            onChange={handleRawJsonChange}
            rows={6}
            className={`w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg border focus:ring-1 focus:outline-none resize-y ${
              jsonError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:ring-indigo-500'
            }`}
            placeholder="{}"
          />
          {jsonError ? (
            <p className="text-xs text-rose-500 dark:text-rose-400 font-mono">{jsonError}</p>
          ) : (
            <p className="text-[11px] text-slate-400">Valid JSON object automatically saved.</p>
          )}
        </div>
      )}
    </div>
  );
};
