'use client';

import { useState, useEffect } from 'react';
import { formatJsonString } from '@/src/core/utils/json';

export type KeyValueRow = {
  key: string;
  value: string;
  isFile: boolean;
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
