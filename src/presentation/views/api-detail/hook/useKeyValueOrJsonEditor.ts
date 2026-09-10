'use client';

import { useState, useEffect } from 'react';
import { formatJsonString } from '@/src/core/utils/json';
import { ParamMatchOperator } from '@/src/core/utils/types';
import { extractParamRule, isParamRule } from '@/src/core/utils/param-matcher';

export type KeyValueRow = {
  key: string;
  value: string;
  isFile: boolean;
  operator: ParamMatchOperator;
  enabled: boolean;
};

export function useKeyValueOrJsonEditor(
  value: string,
  onChange: (newValue: string) => void,
  supportFiles = false
) {
  const [mode, setMode] = useState<'raw' | 'key-value'>('key-value');
  const [rows, setRows] = useState<KeyValueRow[]>([]);

  // Helper to convert JSON string to rows
  const syncJsonToRows = (jsonStr: string) => {
    try {
      const obj = JSON.parse(jsonStr);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const parsedRows = Object.entries(obj).map(([k, v]) => {
          if (supportFiles && v && typeof v === 'object' && 'filename' in v) {
            return {
              key: k,
              value: String((v as any).filename || ''),
              isFile: true,
              operator: 'equal' as ParamMatchOperator,
              enabled: true,
            };
          }
          if (supportFiles && typeof v === 'string' && (v === '(binary_file_data)' || v.startsWith('(binary_file'))) {
            return {
              key: k,
              value: v,
              isFile: true,
              operator: 'equal' as ParamMatchOperator,
              enabled: true,
            };
          }
          if (isParamRule(v)) {
            const rule = extractParamRule(v);
            const valStr =
              rule.value !== undefined
                ? typeof rule.value === 'object'
                  ? JSON.stringify(rule.value)
                  : String(rule.value)
                : '';
            return {
              key: k,
              value: valStr,
              isFile: false,
              operator: rule.operator,
              enabled: rule.enabled !== false,
            };
          }
          return {
            key: k,
            value: typeof v === 'object' ? JSON.stringify(v) : String(v),
            isFile: false,
            operator: 'equal' as ParamMatchOperator,
            enabled: true,
          };
        });
        setRows(parsedRows.length > 0 ? parsedRows : [{ key: '', value: '', isFile: false, operator: 'equal', enabled: true }]);
        return;
      }
    } catch {}
    setRows([{ key: '', value: '', isFile: false, operator: 'equal', enabled: true }]);
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
        let parsedVal: any = row.value;

        if (trimmedVal === 'true') {
          parsedVal = true;
        } else if (trimmedVal === 'false') {
          parsedVal = false;
        } else if (trimmedVal !== '' && !isNaN(Number(trimmedVal))) {
          parsedVal = Number(trimmedVal);
        } else {
          try {
            if ((trimmedVal.startsWith('{') && trimmedVal.endsWith('}')) || (trimmedVal.startsWith('[') && trimmedVal.endsWith(']'))) {
              parsedVal = JSON.parse(trimmedVal);
            } else {
              parsedVal = row.value;
            }
          } catch {
            parsedVal = row.value;
          }
        }

        if (row.operator !== 'equal' || row.enabled === false) {
          obj[row.key] = {
            $operator: row.operator,
            $value: row.operator === 'null' || row.operator === 'empty_array' ? undefined : parsedVal,
            $enabled: row.enabled,
          };
        } else {
          obj[row.key] = parsedVal;
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
    const updatedRows = [...rows, { key: '', value: '', isFile: false, operator: 'equal' as ParamMatchOperator, enabled: true }];
    setRows(updatedRows);
  };

  const deleteRow = (index: number) => {
    let updatedRows = rows.filter((_, i) => i !== index);
    if (updatedRows.length === 0) {
      updatedRows = [{ key: '', value: '', isFile: false, operator: 'equal' as ParamMatchOperator, enabled: true }];
    }
    setRows(updatedRows);
    onChange(rowsToJson(updatedRows));
  };

  const handleBeautify = () => {
    onChange(formatJsonString(value));
  };

  return {
    mode,
    rows,
    handleModeChange,
    updateRow,
    addRow,
    deleteRow,
    handleBeautify,
  };
}
