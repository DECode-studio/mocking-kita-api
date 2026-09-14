'use client';


import { useState, useEffect, useCallback } from 'react';
import { formatJsonString } from '@/src/core/utils/json';
import { ParamMatchOperator } from '@/src/core/utils/types';
import { extractParamRule, isParamRule } from '@/src/core/utils/param-matcher';

export type LeafRuleUpdate = {
  key?: string;
  operator?: ParamMatchOperator;
  value?: unknown;
  enabled?: boolean;
  isFile?: boolean;
};

function parseJsonSafe(val: string): unknown {
  const trimmed = val.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    return {};
  }
}

export function parsePrimitiveValue(val: string): unknown {
  const trimmed = val.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed !== '' && !isNaN(Number(trimmed)) && !trimmed.startsWith('0x')) {
    return Number(trimmed);
  }
  return val;
}

function setDeepPath(root: unknown, path: (string | number)[], value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  if (typeof head === 'number' || (Array.isArray(root) && !isNaN(Number(head)))) {
    const idx = Number(head);
    const arr = Array.isArray(root) ? [...root] : [];
    arr[idx] = setDeepPath(arr[idx], tail, value);
    return arr;
  }
  const key = String(head);
  const obj =
    root && typeof root === 'object' && !Array.isArray(root)
      ? { ...(root as Record<string, unknown>) }
      : {};
  obj[key] = setDeepPath(obj[key], tail, value);
  return obj;
}

function removeDeepPath(root: unknown, path: (string | number)[]): unknown {
  if (path.length === 0) return {};
  if (path.length === 1) {
    const [head] = path;
    if (Array.isArray(root) && typeof head === 'number') {
      const arr = [...root];
      arr.splice(head, 1);
      return arr;
    }
    if (root && typeof root === 'object' && !Array.isArray(root)) {
      const obj = { ...(root as Record<string, unknown>) };
      delete obj[String(head)];
      return obj;
    }
    return root;
  }
  const [head, ...tail] = path;
  if (Array.isArray(root) && typeof head === 'number') {
    const arr = [...root];
    arr[head] = removeDeepPath(arr[head], tail);
    return arr;
  }
  if (root && typeof root === 'object' && !Array.isArray(root)) {
    const obj = { ...(root as Record<string, unknown>) };
    const key = String(head);
    obj[key] = removeDeepPath(obj[key], tail);
    return obj;
  }
  return root;
}

function renameDeepKey(
  root: unknown,
  parentPath: (string | number)[],
  oldKey: string,
  newKey: string
): unknown {
  if (oldKey === newKey) return root;
  if (parentPath.length === 0) {
    if (root && typeof root === 'object' && !Array.isArray(root)) {
      const entries = Object.entries(root as Record<string, unknown>);
      const newObj: Record<string, unknown> = {};
      for (const [k, v] of entries) {
        if (k === oldKey) {
          newObj[newKey] = v;
        } else {
          newObj[k] = v;
        }
      }
      return newObj;
    }
    return root;
  }
  const [head, ...tail] = parentPath;
  if (Array.isArray(root) && typeof head === 'number') {
    const arr = [...root];
    arr[head] = renameDeepKey(arr[head], tail, oldKey, newKey);
    return arr;
  }
  if (root && typeof root === 'object' && !Array.isArray(root)) {
    const obj = { ...(root as Record<string, unknown>) };
    const key = String(head);
    obj[key] = renameDeepKey(obj[key], tail, oldKey, newKey);
    return obj;
  }
  return root;
}

function addDeepChild(
  root: unknown,
  parentPath: (string | number)[],
  childType: 'field' | 'object' | 'array'
): unknown {
  const initialVal = childType === 'object' ? {} : childType === 'array' ? [] : '';
  if (parentPath.length === 0) {
    if (Array.isArray(root)) {
      return [...root, initialVal];
    }
    const obj =
      root && typeof root === 'object' && !Array.isArray(root)
        ? { ...(root as Record<string, unknown>) }
        : {};
    let idx = 1;
    while (`field_${idx}` in obj) {
      idx++;
    }
    obj[`field_${idx}`] = initialVal;
    return obj;
  }
  const [head, ...tail] = parentPath;
  if (Array.isArray(root) && typeof head === 'number') {
    const arr = [...root];
    arr[head] = addDeepChild(arr[head], tail, childType);
    return arr;
  }
  if (root && typeof root === 'object' && !Array.isArray(root)) {
    const obj = { ...(root as Record<string, unknown>) };
    const key = String(head);
    obj[key] = addDeepChild(obj[key], tail, childType);
    return obj;
  }
  return root;
}

export function useKeyValueOrJsonEditor(
  value: string,
  onChange: (newValue: string) => void,
  supportFiles = false
) {
  const [mode, setMode] = useState<'raw' | 'key-value'>('key-value');
  const [parsedData, setParsedData] = useState<unknown>(() => parseJsonSafe(value));

  // Sync incoming value to parsedData
  useEffect(() => {
    setParsedData(parseJsonSafe(value));
  }, [value]);

  const commitData = useCallback(
    (nextData: unknown) => {
      setParsedData(nextData);
      onChange(JSON.stringify(nextData, null, 2));
    },
    [onChange]
  );

  const handleModeChange = (newMode: 'raw' | 'key-value') => {
    if (newMode === 'key-value') {
      setParsedData(parseJsonSafe(value));
    }
    setMode(newMode);
  };

  const updateLeaf = (path: (string | number)[], update: LeafRuleUpdate) => {
    let currentVal: unknown;
    let curr: any = parsedData;
    for (const seg of path) {
      if (curr == null) break;
      curr = curr[seg];
    }
    currentVal = curr;

    let op: ParamMatchOperator = 'equal';
    let val: unknown = currentVal;
    let enabled = true;
    let isFile = false;

    if (supportFiles && currentVal && typeof currentVal === 'object' && 'filename' in currentVal) {
      isFile = true;
      val = (currentVal as any).filename;
    } else if (isParamRule(currentVal)) {
      const rule = extractParamRule(currentVal);
      op = rule.operator;
      val = rule.value;
      enabled = rule.enabled !== false;
    }

    if (update.operator !== undefined) op = update.operator;
    if (update.value !== undefined) val = update.value;
    if (update.enabled !== undefined) enabled = update.enabled;
    if (update.isFile !== undefined) isFile = update.isFile;

    let finalVal: unknown = val;
    if (supportFiles && isFile) {
      finalVal = { filename: val };
    } else if (op !== 'equal' || !enabled) {
      finalVal = {
        $operator: op,
        $value: op === 'null' || op === 'empty_array' ? undefined : val,
        $enabled: enabled,
      };
    }

    const nextData = setDeepPath(parsedData, path, finalVal);
    commitData(nextData);
  };

  const renameKey = (parentPath: (string | number)[], oldKey: string, newKey: string) => {
    const nextData = renameDeepKey(parsedData, parentPath, oldKey, newKey);
    commitData(nextData);
  };

  const deletePath = (path: (string | number)[]) => {
    const nextData = removeDeepPath(parsedData, path);
    commitData(nextData);
  };

  const addChild = (parentPath: (string | number)[], childType: 'field' | 'object' | 'array') => {
    const nextData = addDeepChild(parsedData, parentPath, childType);
    commitData(nextData);
  };

  const handleBeautify = () => {
    onChange(formatJsonString(value));
  };

  return {
    mode,
    parsedData,
    handleModeChange,
    updateLeaf,
    renameKey,
    deletePath,
    addChild,
    handleBeautify,
  };
}
