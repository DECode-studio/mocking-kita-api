import { useState, useEffect } from 'react';
import { objectToKeyValuePairs, keyValuePairsToObject, validateJsonString } from '@/src/core/utils/json';
import { getErrorMessage } from '@/src/core/utils/error';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export function useKeyValueEditor(
  value: Record<string, unknown>,
  onChange: (value: Record<string, unknown>) => void
) {
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => objectToKeyValuePairs(value));
  const [mode, setMode] = useState<'table' | 'json'>('table');
  const [rawJsonText, setRawJsonText] = useState<string>(() => JSON.stringify(value || {}, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'table') {
      const currentObj = keyValuePairsToObject(pairs);
      if (JSON.stringify(currentObj) !== JSON.stringify(value)) {
        setPairs(objectToKeyValuePairs(value));
      }
    }
  }, [value, mode]);

  const updatePairsAndTriggerChange = (newPairs: KeyValuePair[]) => {
    setPairs(newPairs);
    const obj = keyValuePairsToObject(newPairs);
    onChange(obj);
  };

  const handleAddRow = () => {
    const newPair: KeyValuePair = {
      id: `kv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      key: '',
      value: '',
      enabled: true,
    };
    updatePairsAndTriggerChange([...pairs, newPair]);
  };

  const handleRemoveRow = (id: string) => {
    const newPairs = pairs.filter((p) => p.id !== id);
    updatePairsAndTriggerChange(newPairs);
  };

  const handleRowChange = (id: string, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
    const newPairs = pairs.map((p) => (p.id === id ? { ...p, [field]: val } : p));
    updatePairsAndTriggerChange(newPairs);
  };

  const handleClearAll = () => {
    updatePairsAndTriggerChange([]);
  };

  const handleSwitchToRawJson = () => {
    const currentObj = keyValuePairsToObject(pairs);
    setRawJsonText(JSON.stringify(currentObj, null, 2));
    setJsonError(null);
    setMode('json');
  };

  const handleSwitchToTable = () => {
    const validation = validateJsonString(rawJsonText);
    if (!validation.isValid) {
      setJsonError(validation.error || 'Invalid JSON syntax');
      return;
    }
    try {
      const parsed = JSON.parse(rawJsonText || '{}');
      const newPairs = objectToKeyValuePairs(parsed);
      setPairs(newPairs);
      onChange(parsed);
      setJsonError(null);
      setMode('table');
    } catch (error: unknown) {
      setJsonError(getErrorMessage(error, 'Failed to parse JSON'));
    }
  };

  const handleRawJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawJsonText(text);
    const validation = validateJsonString(text);
    if (validation.isValid) {
      setJsonError(null);
      try {
        const parsed = JSON.parse(text || '{}');
        onChange(parsed);
      } catch {}
    } else {
      setJsonError(validation.error || 'Invalid JSON');
    }
  };

  return {
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
  };
}
