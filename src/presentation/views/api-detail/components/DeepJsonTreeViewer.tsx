'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { extractParamRule, isParamRule } from '@/src/core/utils/param-matcher';
import { ParamMatchOperator } from '@/src/core/utils/types';
import { StatusSwitch } from '@/src/presentation/components/shared/StatusSwitch';

interface DeepJsonTreeViewerProps {
  data: unknown;
  onTogglePath?: (path: (string | number)[], currentEnabled: boolean) => void;
  readOnly?: boolean;
}

const OPERATOR_COLORS: Record<ParamMatchOperator, string> = {
  equal: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  regex: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  regex_i: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  null: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  empty_array: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
};

const OperatorBadge: React.FC<{ operator: ParamMatchOperator }> = ({ operator }) => {
  const colorClass = OPERATOR_COLORS[operator] || OPERATOR_COLORS.equal;
  return (
    <span
      className={`px-1.5 py-0.2 rounded border text-[10px] font-mono uppercase font-bold tracking-wider ${colorClass}`}
    >
      {operator}
    </span>
  );
};

interface TreeNodeProps {
  label: string | number;
  value: unknown;
  path: (string | number)[];
  onTogglePath?: (path: (string | number)[], currentEnabled: boolean) => void;
  readOnly?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  label,
  value,
  path,
  onTogglePath,
  readOnly = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (isParamRule(value)) {
    const rule = extractParamRule(value);
    const isEnabled = rule.enabled !== false;

    return (
      <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-xs font-mono group">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`font-semibold text-slate-700 dark:text-slate-300 ${!isEnabled ? 'line-through opacity-50' : ''}`}>
            {label}:
          </span>
          <OperatorBadge operator={rule.operator} />
          {rule.operator !== 'null' && rule.operator !== 'empty_array' && (
            <span
              className={`text-slate-900 dark:text-slate-100 truncate ${
                !isEnabled ? 'line-through opacity-50' : ''
              }`}
            >
              {typeof rule.value === 'object' ? JSON.stringify(rule.value) : String(rule.value ?? '')}
            </span>
          )}
          {!isEnabled && (
            <span className="text-[10px] text-amber-500 font-medium">(Disabled)</span>
          )}
        </div>
        {onTogglePath && !readOnly && (
          <div className="shrink-0 pl-2">
            <StatusSwitch
              checked={isEnabled}
              onCheckedChange={() => onTogglePath(path, isEnabled)}
              size="sm"
            />
          </div>
        )}
      </div>
    );
  }

  if (value && typeof value === 'object') {
    const isArray = Array.isArray(value);
    const entries = isArray
      ? (value as unknown[]).map((v, i) => [i, v] as [number, unknown])
      : Object.entries(value as Record<string, unknown>);

    const count = entries.length;

    return (
      <div className="space-y-0.5 text-xs font-mono">
        <div
          className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-100/60 dark:hover:bg-slate-800/40 cursor-pointer select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-1.5">
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {label}
            </span>
            <span className="text-[10px] text-slate-400">
              {isArray ? `[${count}]` : `{${count}}`}
            </span>
          </div>
        </div>

        {isOpen && (
          <div className="pl-4 border-l border-slate-200 dark:border-slate-800 space-y-0.5 ml-2">
            {entries.map(([childKey, childVal]) => (
              <TreeNode
                key={childKey}
                label={childKey}
                value={childVal}
                path={[...path, childKey]}
                onTogglePath={onTogglePath}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Primitive value
  return (
    <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-xs font-mono">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {label}:
        </span>
        <OperatorBadge operator="equal" />
        <span className="text-slate-900 dark:text-slate-100 truncate">
          {String(value ?? '')}
        </span>
      </div>
      {onTogglePath && !readOnly && (
        <div className="shrink-0 pl-2">
          <StatusSwitch
            checked={true}
            onCheckedChange={() => onTogglePath(path, true)}
            size="sm"
          />
        </div>
      )}
    </div>
  );
};

export const DeepJsonTreeViewer: React.FC<DeepJsonTreeViewerProps> = ({
  data,
  onTogglePath,
  readOnly = false,
}) => {
  if (data == null || (typeof data === 'object' && Object.keys(data as object).length === 0)) {
    return (
      <div className="text-xs font-mono text-slate-400 italic py-1 px-2">
        (Empty)
      </div>
    );
  }

  if (typeof data !== 'object') {
    return (
      <div className="text-xs font-mono text-slate-800 dark:text-slate-200 py-1 px-2">
        {String(data)}
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [i, v] as [number, unknown])
    : Object.entries(data as Record<string, unknown>);

  return (
    <div className="space-y-0.5 py-1">
      {entries.map(([key, value]) => (
        <TreeNode
          key={key}
          label={key}
          value={value}
          path={[key]}
          onTogglePath={onTogglePath}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
};
