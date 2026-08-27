'use client';

import React from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { useKeyValueOrJsonEditor } from '../hook/useKeyValueOrJsonEditor';

interface KeyValueOrJsonEditorProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  supportFiles?: boolean;
  placeholderValue?: string;
  idPrefix?: string;
}

export const KeyValueOrJsonEditor: React.FC<KeyValueOrJsonEditorProps> = ({
  label,
  value,
  onChange,
  supportFiles = false,
  placeholderValue = 'Value',
  idPrefix,
}) => {
  const {
    mode,
    rows,
    handleModeChange,
    updateRow,
    addRow,
    deleteRow,
    handleBeautify,
  } = useKeyValueOrJsonEditor(value, onChange, supportFiles);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {mode === 'raw' && (
            <button
              id={idPrefix ? `${idPrefix}-beautify` : undefined}
              type="button"
              onClick={handleBeautify}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline mr-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              Beautify
            </button>
          )}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-950 text-[10px]">
            <button
              id={idPrefix ? `${idPrefix}-mode-key-value` : undefined}
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
              id={idPrefix ? `${idPrefix}-mode-raw` : undefined}
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
          id={idPrefix ? `${idPrefix}-raw-textarea` : undefined}
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
                id={idPrefix ? `${idPrefix}-row-${index}-key` : undefined}
                type="text"
                value={row.key}
                onChange={(e) => updateRow(index, { key: e.target.value })}
                placeholder="Key"
                className="w-1/3 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <input
                id={idPrefix ? `${idPrefix}-row-${index}-value` : undefined}
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
                className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Remove Row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            id={idPrefix ? `${idPrefix}-add-row` : undefined}
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
      )}
    </div>
  );
};
