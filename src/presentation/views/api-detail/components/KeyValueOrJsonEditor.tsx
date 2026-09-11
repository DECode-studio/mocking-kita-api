'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  ListPlus,
} from 'lucide-react';
import { useKeyValueOrJsonEditor, parsePrimitiveValue } from '../hook/useKeyValueOrJsonEditor';
import { ParamMatchOperator } from '@/src/core/utils/types';
import { isParamRule, extractParamRule } from '@/src/core/utils/param-matcher';
import { StatusSwitch } from '@/src/presentation/components/shared/StatusSwitch';

interface KeyValueOrJsonEditorProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  supportFiles?: boolean;
  placeholderValue?: string;
  idPrefix?: string;
}

interface TreeNodeEditorProps {
  label: string | number;
  value: unknown;
  path: (string | number)[];
  parentPath: (string | number)[];
  parentIsArray: boolean;
  supportFiles?: boolean;
  placeholderValue?: string;
  idPrefix?: string;
  onUpdateLeaf: (
    path: (string | number)[],
    update: {
      operator?: ParamMatchOperator;
      value?: unknown;
      enabled?: boolean;
      isFile?: boolean;
    }
  ) => void;
  onRenameKey: (
    parentPath: (string | number)[],
    oldKey: string,
    newKey: string
  ) => void;
  onDeletePath: (path: (string | number)[]) => void;
  onAddChild: (
    parentPath: (string | number)[],
    childType: 'field' | 'object' | 'array'
  ) => void;
}

const TreeNodeEditor: React.FC<TreeNodeEditorProps> = ({
  label,
  value,
  path,
  parentPath,
  parentIsArray,
  supportFiles = false,
  placeholderValue = 'Value',
  idPrefix,
  onUpdateLeaf,
  onRenameKey,
  onDeletePath,
  onAddChild,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [keyInput, setKeyInput] = useState(String(label));

  // Keep keyInput synchronized with label
  React.useEffect(() => {
    setKeyInput(String(label));
  }, [label]);

  const handleKeyBlur = () => {
    const trimmed = keyInput.trim();
    if (trimmed && trimmed !== String(label)) {
      onRenameKey(parentPath, String(label), trimmed);
    } else {
      setKeyInput(String(label));
    }
  };

  // 1. ParamRule Leaf Node
  if (isParamRule(value)) {
    const rule = extractParamRule(value);
    const isEnabled = rule.enabled !== false;
    const isValDisabled = rule.operator === 'null' || rule.operator === 'empty_array';
    const isFile =
      supportFiles &&
      rule.value &&
      typeof rule.value === 'object' &&
      'filename' in (rule.value as Record<string, unknown>);

    const displayValue = isFile
      ? String((rule.value as Record<string, unknown>).filename || '')
      : typeof rule.value === 'object'
      ? JSON.stringify(rule.value)
      : String(rule.value ?? '');

    return (
      <div className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
        <StatusSwitch
          checked={isEnabled}
          onCheckedChange={(checked) => onUpdateLeaf(path, { enabled: checked })}
          size="sm"
        />

        {parentIsArray ? (
          <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold rounded">
            #{label}
          </span>
        ) : (
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onBlur={handleKeyBlur}
            placeholder="Key"
            className={`w-1/4 min-w-20 max-w-35 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
              !isEnabled ? 'line-through opacity-50' : ''
            }`}
          />
        )}

        <select
          value={rule.operator}
          onChange={(e) =>
            onUpdateLeaf(path, { operator: e.target.value as ParamMatchOperator })
          }
          className="px-1.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="equal">= equal</option>
          <option value="regex">.* regex</option>
          <option value="null">∅ null</option>
          <option value="empty_array">[] empty_array</option>
        </select>

        <input
          type="text"
          value={isValDisabled ? `(${rule.operator})` : displayValue}
          disabled={isValDisabled}
          onChange={(e) =>
            onUpdateLeaf(path, {
              value: parsePrimitiveValue(e.target.value),
            })
          }
          placeholder={
            isValDisabled
              ? `(${rule.operator})`
              : isFile
              ? 'File name pattern (e.g. avatar.png)'
              : placeholderValue
          }
          className={`flex-1 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
            isValDisabled ? 'opacity-40 italic cursor-not-allowed' : ''
          } ${!isEnabled ? 'line-through opacity-50' : ''}`}
        />

        {supportFiles && (
          <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFile}
              onChange={(e) => onUpdateLeaf(path, { isFile: e.target.checked })}
              className="w-3 h-3 text-indigo-600 rounded border-slate-300"
            />
            <span>File?</span>
          </label>
        )}

        <button
          type="button"
          onClick={() => onDeletePath(path)}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
          title="Delete Field"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // 2. Object or Array Branch Node
  if (value && typeof value === 'object') {
    const isArray = Array.isArray(value);
    const entries = isArray
      ? (value as unknown[]).map((v, i) => [i, v] as [number, unknown])
      : Object.entries(value as Record<string, unknown>);

    const count = entries.length;

    return (
      <div className="space-y-1 py-1">
        <div className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 select-none">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              )}
            </button>

            {parentIsArray ? (
              <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold rounded">
                #{label}
              </span>
            ) : (
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onBlur={handleKeyBlur}
                placeholder="Key"
                className="w-1/4 min-w-20 max-w-35 px-1.5 py-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-xs font-mono font-semibold focus:outline-none"
              />
            )}

            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {isArray ? `Array [${count}]` : `Object {${count}}`}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onAddChild(path, 'field')}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs cursor-pointer transition-colors"
              title="Add Field inside"
            >
              <Plus className="w-2.5 h-2.5" /> Field
            </button>
            <button
              type="button"
              onClick={() => onAddChild(path, 'object')}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs cursor-pointer transition-colors"
              title="Add Nested Object"
            >
              <FolderPlus className="w-2.5 h-2.5" /> Object
            </button>
            <button
              type="button"
              onClick={() => onAddChild(path, 'array')}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs cursor-pointer transition-colors"
              title="Add Nested Array"
            >
              <ListPlus className="w-2.5 h-2.5" /> Array
            </button>
            <button
              type="button"
              onClick={() => onDeletePath(path)}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
              title="Delete Section"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="pl-3 border-l-2 border-indigo-200 dark:border-indigo-900/50 ml-2 space-y-1">
            {count === 0 ? (
              <div className="text-[11px] font-mono text-slate-400 italic py-1 px-2">
                {isArray ? '(Empty Array)' : '(Empty Object)'}
              </div>
            ) : (
              entries.map(([childKey, childVal]) => (
                <TreeNodeEditor
                  key={childKey}
                  label={childKey}
                  value={childVal}
                  path={[...path, childKey]}
                  parentPath={path}
                  parentIsArray={isArray}
                  supportFiles={supportFiles}
                  placeholderValue={placeholderValue}
                  idPrefix={idPrefix}
                  onUpdateLeaf={onUpdateLeaf}
                  onRenameKey={onRenameKey}
                  onDeletePath={onDeletePath}
                  onAddChild={onAddChild}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. Primitive Leaf Node (string, number, boolean, null)
  const isFile =
    supportFiles &&
    value &&
    typeof value === 'object' &&
    'filename' in (value as Record<string, unknown>);

  const displayValue = isFile
    ? String((value as Record<string, unknown>).filename || '')
    : String(value ?? '');

  return (
    <div className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
      <StatusSwitch
        checked={true}
        onCheckedChange={(checked) => onUpdateLeaf(path, { enabled: checked })}
        size="sm"
      />

      {parentIsArray ? (
        <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold rounded">
          #{label}
        </span>
      ) : (
        <input
          type="text"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onBlur={handleKeyBlur}
          placeholder="Key"
          className="w-1/4 min-w-20 max-w-35 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
        />
      )}

      <select
        value="equal"
        onChange={(e) =>
          onUpdateLeaf(path, { operator: e.target.value as ParamMatchOperator })
        }
        className="px-1.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
      >
        <option value="equal">= equal</option>
        <option value="regex">.* regex</option>
        <option value="null">∅ null</option>
        <option value="empty_array">[] empty_array</option>
      </select>

      <input
        type="text"
        value={displayValue}
        onChange={(e) =>
          onUpdateLeaf(path, {
            value: parsePrimitiveValue(e.target.value),
          })
        }
        placeholder={
          isFile ? 'File name pattern (e.g. avatar.png)' : placeholderValue
        }
        className="flex-1 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
      />

      {supportFiles && (
        <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isFile}
            onChange={(e) => onUpdateLeaf(path, { isFile: e.target.checked })}
            className="w-3 h-3 text-indigo-600 rounded border-slate-300"
          />
          <span>File?</span>
        </label>
      )}

      <button
        type="button"
        onClick={() => onDeletePath(path)}
        className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
        title="Delete Field"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

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
    parsedData,
    handleModeChange,
    updateLeaf,
    renameKey,
    deletePath,
    addChild,
    handleBeautify,
  } = useKeyValueOrJsonEditor(value, onChange, supportFiles);

  const isDataEmpty =
    parsedData == null ||
    (typeof parsedData === 'object' && Object.keys(parsedData as object).length === 0);

  const rootEntries =
    parsedData && typeof parsedData === 'object'
      ? Array.isArray(parsedData)
        ? (parsedData as unknown[]).map((v, i) => [i, v] as [number, unknown])
        : Object.entries(parsedData as Record<string, unknown>)
      : [];

  const rootIsArray = Array.isArray(parsedData);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {mode === 'raw' && (
            <button
              id={idPrefix ? `${idPrefix}-beautify` : undefined}
              type="button"
              onClick={handleBeautify}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline mr-1 cursor-pointer"
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
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
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
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
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
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`e.g. { "id": 123 }`}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
        />
      ) : (
        <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-950/20 max-h-80 overflow-y-auto">
          {isDataEmpty ? (
            <div className="text-center py-4 text-xs text-slate-400 italic bg-white/40 dark:bg-slate-900/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
              No fields configured yet. Click below to add.
            </div>
          ) : (
            <div className="space-y-1">
              {rootEntries.map(([k, v]) => (
                <TreeNodeEditor
                  key={k}
                  label={k}
                  value={v}
                  path={[k]}
                  parentPath={[]}
                  parentIsArray={rootIsArray}
                  supportFiles={supportFiles}
                  placeholderValue={placeholderValue}
                  idPrefix={idPrefix}
                  onUpdateLeaf={updateLeaf}
                  onRenameKey={renameKey}
                  onDeletePath={deletePath}
                  onAddChild={addChild}
                />
              ))}
            </div>
          )}

          {/* Action buttons at root */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              id={idPrefix ? `${idPrefix}-add-field` : undefined}
              type="button"
              onClick={() => addChild([], 'field')}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Field
            </button>
            <button
              id={idPrefix ? `${idPrefix}-add-object` : undefined}
              type="button"
              onClick={() => addChild([], 'object')}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
            >
              <FolderPlus className="w-3 h-3" /> Add Object
            </button>
            <button
              id={idPrefix ? `${idPrefix}-add-array` : undefined}
              type="button"
              onClick={() => addChild([], 'array')}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
            >
              <ListPlus className="w-3 h-3" /> Add Array
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


