'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Table2, X, List, Code2, AlertCircle, Sparkles, Upload, CopyCheck, Trash2 } from 'lucide-react';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { Project } from '@/src/client/domain/project/entity/project';
import { DATA_SHEET_CATEGORIES, DATA_SHEET_SEMANTIC_ID } from '../constant';

interface DataSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSheet: DataSheet | null;
  projects: Project[];
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
}

export const DataSheetModal: React.FC<DataSheetModalProps> = ({
  isOpen,
  onClose,
  editingSheet,
  projects,
  defaultProjectId,
  onSave,
}) => {
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

  // Auto slugify name into code if code wasn't manually edited yet
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingSheet && (!code || code === slugify(name))) {
      setCode(slugify(val));
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const getParsedData = (): any[] => {
    if (inputMode === 'lines' && format === 'LIST') {
      return linesText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } else {
      const parsed = JSON.parse(jsonText.trim() || '[]');
      if (!Array.isArray(parsed)) {
        throw new Error('JSON data must be an array (e.g. ["a", "b"] or [{"id": 1}])');
      }
      return parsed;
    }
  };

  const currentCount = (() => {
    try {
      return getParsedData().length;
    } catch {
      return 0;
    }
  })();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      try {
        if (file.name.endsWith('.json') || content.trim().startsWith('[')) {
          const parsed = JSON.parse(content.trim());
          if (!Array.isArray(parsed)) {
            throw new Error('JSON file must contain an array');
          }
          if (format === 'LIST') {
            setLinesText(parsed.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join('\n'));
          }
          setJsonText(JSON.stringify(parsed, null, 2));
        } else {
          // CSV or TXT line-by-line
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
        setErrorMessage(err.message || 'Failed to read file');
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleDeduplicate = () => {
    if (inputMode === 'lines' && format === 'LIST') {
      const lines = linesText.split('\n').map((l) => l.trim()).filter(Boolean);
      const unique = Array.from(new Set(lines));
      const removed = lines.length - unique.length;
      setLinesText(unique.join('\n'));
      setJsonText(JSON.stringify(unique, null, 2));
      if (removed > 0) {
        setErrorMessage(`Removed ${removed} duplicate ${removed === 1 ? 'entry' : 'entries'}`);
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
          setErrorMessage(`Removed ${removed} duplicate ${removed === 1 ? 'entry' : 'entries'}`);
          setTimeout(() => setErrorMessage(null), 3000);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Invalid JSON syntax');
      }
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText.trim() || '[]');
      setJsonText(JSON.stringify(parsed, null, 2));
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Invalid JSON: ' + err.message);
    }
  };

  const handleClearData = () => {
    setLinesText('');
    setJsonText('[]');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage('Name is required');
      return;
    }
    if (!trimmedCode) {
      setErrorMessage('Code/Slug is required');
      return;
    }
    if (!/^[a-z0-9_.-]+$/.test(trimmedCode)) {
      setErrorMessage('Code can only contain lowercase alphanumeric characters, underscores, dashes, and dots');
      return;
    }

    let parsedData: any[] = [];
    try {
      parsedData = getParsedData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid data format');
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
      setErrorMessage(err.message || 'Failed to save data sheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Table2 className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                  {editingSheet ? 'Edit Data Sheet' : 'Create Data Sheet'}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                  Store an array dataset to use as dynamic parameters in flows and scenarios
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project & Format Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Scope
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Global (All Projects)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dataset Format
                </label>
                <select
                  value={format}
                  onChange={(e) => {
                    const nextFormat = e.target.value as 'LIST' | 'TABLE';
                    setFormat(nextFormat);
                    if (nextFormat === 'TABLE') {
                      setInputMode('json');
                    }
                  }}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="LIST">Simple List (1D Array of values)</option>
                  <option value="TABLE">Table Records (Array of objects)</option>
                </select>
              </div>
            </div>

            {/* Name & Code Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sheet Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Emails, Phone Numbers"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Code / Slug <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. emails, phone_numbers"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toLowerCase().trim())}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Category & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  placeholder="e.g. Contact, Authentication, Payment"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <datalist id="category-suggestions">
                  {DATA_SHEET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Brief context about this dataset..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Variable Tag Preview */}
            {code && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300">
                <Sparkles className="w-4 h-4 shrink-0 text-purple-500" />
                <span>
                  Variable Syntax:{' '}
                  <code className="font-bold font-mono">
                    {format === 'TABLE' ? `{{datasheet.${code}.random.<property>}}` : `{{datasheet.${code}.random}}`}
                  </code>{' '}
                  or{' '}
                  <code className="font-bold font-mono">{`{{datasheet.${code}[0]}}`}</code>
                </span>
              </div>
            )}

            {/* Data Editor Tabs */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Data Values <span className="text-slate-400 font-normal">({currentCount} items)</span>
                </label>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Mode Toggle for LIST format */}
                  {format === 'LIST' && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setInputMode('lines')}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          inputMode === 'lines'
                            ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <List className="w-3 h-3" /> One per Line
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const lines = linesText
                            .split('\n')
                            .map((l) => l.trim())
                            .filter(Boolean);
                          setJsonText(JSON.stringify(lines, null, 2));
                          setInputMode('json');
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          inputMode === 'json'
                            ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <Code2 className="w-3 h-3" /> JSON Array
                      </button>
                    </div>
                  )}

                  {/* Utility Actions */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    title="Import data from CSV, TXT, or JSON file"
                  >
                    <Upload className="w-3 h-3 text-purple-500" />
                    <span>Import</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeduplicate}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    title="Remove duplicate values"
                  >
                    <CopyCheck className="w-3 h-3 text-emerald-500" />
                    <span>Deduplicate</span>
                  </button>

                  {inputMode === 'json' && (
                    <button
                      type="button"
                      onClick={handleFormatJson}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                      title="Prettify JSON syntax"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Format</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleClearData}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Clear all data"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {inputMode === 'lines' && format === 'LIST' ? (
                <div>
                  <textarea
                    rows={7}
                    placeholder={`Paste or enter items one per line, e.g.:\nasdas@asdas.com\ncsddvs@zdfa.com\ndaasda@zsdasf.vom`}
                    value={linesText}
                    onChange={(e) => setLinesText(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter one value per line. Empty lines are automatically ignored.
                  </p>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={7}
                    placeholder={
                      format === 'TABLE'
                        ? '[\n  { "phone": "08123456789", "name": "Budi" },\n  { "phone": "08987654321", "name": "Ani" }\n]'
                        : '[\n  "asdas@asdas.com",\n  "csddvs@zdfa.com"\n]'
                    }
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Must be a valid JSON array format.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-xs font-semibold px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingSheet ? 'Update Sheet' : 'Create Sheet'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
