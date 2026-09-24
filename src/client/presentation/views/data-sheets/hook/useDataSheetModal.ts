'use client';

import { useState, useEffect, useRef, useCallback, FormEvent, ChangeEvent } from 'react';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { DATA_SHEET_TEXT } from '../constant';

interface UseDataSheetModalProps {
  isOpen: boolean;
  editingSheet: DataSheet | null;
  defaultProjectId?: string;
  onSave: (input: {
    id?: string;
    projectId?: string | null;
    name: string;
    code: string;
    category?: string | null;
    description?: string | null;
    format: 'LIST' | 'TABLE';
    data: any[];
    status?: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export const useDataSheetModal = ({
  isOpen,
  editingSheet,
  defaultProjectId,
  onSave,
  onClose,
}: UseDataSheetModalProps) => {
  const [projectId, setProjectId] = useState<string>('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<'LIST' | 'TABLE'>('LIST');

  // Input modes
  const [inputMode, setInputMode] = useState<'lines' | 'json'>('lines');
  const [linesText, setLinesText] = useState('');
  const [jsonText, setJsonText] = useState('[]');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSheet) {
      setProjectId(editingSheet.projectId || '');
      setName(editingSheet.name);
      setCode(editingSheet.code);
      setCategory(editingSheet.category || 'General');
      setDescription(editingSheet.description || '');
      setFormat(editingSheet.format);

      if (Array.isArray(editingSheet.data)) {
        if (editingSheet.format === 'LIST') {
          setLinesText(editingSheet.data.map((d) => (typeof d === 'string' ? d : JSON.stringify(d))).join('\n'));
        }
        setJsonText(JSON.stringify(editingSheet.data, null, 2));
      } else {
        setLinesText('');
        setJsonText('[]');
      }
    } else {
      setProjectId(defaultProjectId && defaultProjectId !== 'ALL' ? defaultProjectId : '');
      setName('');
      setCode('');
      setCategory('General');
      setDescription('');
      setFormat('LIST');
      setLinesText('');
      setJsonText('[]');
    }
    setErrorMessage(null);
  }, [editingSheet, defaultProjectId, isOpen]);

  const slugify = useCallback((text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }, []);

  const handleNameChange = useCallback((val: string) => {
    setName(val);
    if (!editingSheet && (!code || code === slugify(name))) {
      setCode(slugify(val));
    }
  }, [editingSheet, code, name, slugify]);

  const getParsedData = useCallback((): any[] => {
    if (inputMode === 'lines' && format === 'LIST') {
      return linesText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } else {
      const parsed = JSON.parse(jsonText.trim() || '[]');
      if (!Array.isArray(parsed)) {
        throw new Error(DATA_SHEET_TEXT.ERR_MUST_BE_ARRAY);
      }
      return parsed;
    }
  }, [inputMode, format, linesText, jsonText]);

  const currentCount = (() => {
    try {
      return getParsedData().length;
    } catch {
      return 0;
    }
  })();

  const handleFileUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      try {
        if (file.name.endsWith('.json') || content.trim().startsWith('[')) {
          const parsed = JSON.parse(content.trim());
          if (!Array.isArray(parsed)) {
            throw new Error(DATA_SHEET_TEXT.ERR_MUST_BE_ARRAY);
          }
          if (format === 'LIST') {
            setLinesText(parsed.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join('\n'));
          }
          setJsonText(JSON.stringify(parsed, null, 2));
        } else {
          const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          if (format === 'TABLE' && rawLines.length > 0) {
            const headers = rawLines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
            const records = rawLines.slice(1).map((line) => {
              const vals = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
              const row: Record<string, any> = {};
              headers.forEach((h, i) => {
                row[h] = vals[i] ?? '';
              });
              return row;
            });
            setJsonText(JSON.stringify(records, null, 2));
          } else {
            setLinesText(rawLines.join('\n'));
            setJsonText(JSON.stringify(rawLines, null, 2));
          }
        }
        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage(err.message || DATA_SHEET_TEXT.ERR_FAILED_FILE_READ);
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  }, [format]);

  const handleFormatChange = useCallback((nextFormat: 'LIST' | 'TABLE') => {
    setFormat(nextFormat);
    if (nextFormat === 'TABLE') {
      setInputMode('json');
    }
  }, []);

  const handleSwitchToJsonMode = useCallback(() => {
    const lines = linesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    setJsonText(JSON.stringify(lines, null, 2));
    setInputMode('json');
  }, [linesText]);

  const handleSwitchToLinesMode = useCallback(() => {
    setInputMode('lines');
  }, []);

  const handleDeduplicate = useCallback(() => {
    if (inputMode === 'lines' && format === 'LIST') {
      const lines = linesText.split('\n').map((l) => l.trim()).filter(Boolean);
      const unique = Array.from(new Set(lines));
      const removed = lines.length - unique.length;
      setLinesText(unique.join('\n'));
      setJsonText(JSON.stringify(unique, null, 2));
      if (removed > 0) {
        setErrorMessage(DATA_SHEET_TEXT.REMOVED_DUPLICATES(removed));
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } else {
      try {
        const arr = JSON.parse(jsonText.trim() || '[]');
        if (!Array.isArray(arr)) return;
        const seen = new Set<string>();
        const unique = arr.filter((item) => {
          const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const removed = arr.length - unique.length;
        setJsonText(JSON.stringify(unique, null, 2));
        if (format === 'LIST') {
          setLinesText(unique.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join('\n'));
        }
        if (removed > 0) {
          setErrorMessage(DATA_SHEET_TEXT.REMOVED_DUPLICATES(removed));
          setTimeout(() => setErrorMessage(null), 3000);
        }
      } catch (err: any) {
        setErrorMessage(err.message || DATA_SHEET_TEXT.ERR_INVALID_JSON);
      }
    }
  }, [inputMode, format, linesText, jsonText]);

  const handleFormatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText.trim() || '[]');
      setJsonText(JSON.stringify(parsed, null, 2));
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(DATA_SHEET_TEXT.ERR_INVALID_JSON + ': ' + err.message);
    }
  }, [jsonText]);

  const handleClearData = useCallback(() => {
    setLinesText('');
    setJsonText('[]');
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage(DATA_SHEET_TEXT.ERR_NAME_REQUIRED);
      return;
    }
    if (!trimmedCode) {
      setErrorMessage(DATA_SHEET_TEXT.ERR_CODE_REQUIRED);
      return;
    }
    if (!/^[a-z0-9_.-]+$/.test(trimmedCode)) {
      setErrorMessage(DATA_SHEET_TEXT.ERR_INVALID_CODE_PATTERN);
      return;
    }

    let parsedData: any[] = [];
    try {
      parsedData = getParsedData();
    } catch (err: any) {
      setErrorMessage(err.message || DATA_SHEET_TEXT.ERR_INVALID_DATA_FORMAT);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: editingSheet?.id,
        projectId: projectId ? projectId : null,
        name: trimmedName,
        code: trimmedCode,
        category: category.trim() || null,
        description: description.trim() || null,
        format,
        data: parsedData,
        status: editingSheet?.status ?? true,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || DATA_SHEET_TEXT.ERR_FAILED_SAVE);
    } finally {
      setIsSubmitting(false);
    }
  }, [name, code, getParsedData, onSave, editingSheet, projectId, category, description, format, onClose]);

  return {
    projectId,
    setProjectId,
    name,
    setName,
    code,
    setCode,
    category,
    setCategory,
    description,
    setDescription,
    format,
    setFormat,
    inputMode,
    setInputMode,
    linesText,
    setLinesText,
    jsonText,
    setJsonText,
    isSubmitting,
    errorMessage,
    setErrorMessage,
    fileInputRef,
    currentCount,
    handleNameChange,
    handleFormatChange,
    handleSwitchToJsonMode,
    handleSwitchToLinesMode,
    handleFileUpload,
    handleDeduplicate,
    handleFormatJson,
    handleClearData,
    handleSubmit,
  };
};
