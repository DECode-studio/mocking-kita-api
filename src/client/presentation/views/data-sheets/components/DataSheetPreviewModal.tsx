'use client';

import React, { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Table2, X, Search, Copy, Check, Download, Edit2, Sparkles } from 'lucide-react';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { DataSheetVariableTagBadge } from './DataSheetVariableTagBadge';
import { DATA_SHEET_SEMANTIC_ID } from '../constant';

interface DataSheetPreviewModalProps {
  sheet: DataSheet | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (sheet: DataSheet) => void;
}

export const DataSheetPreviewModal: React.FC<DataSheetPreviewModalProps> = ({
  sheet,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [search, setSearch] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const items = useMemo(() => {
    if (!sheet || !Array.isArray(sheet.data)) return [];
    return sheet.data;
  }, [sheet]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items.map((item, originalIndex) => ({ item, originalIndex }));
    const q = search.toLowerCase();
    return items
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        const str = typeof item === 'object' ? JSON.stringify(item) : String(item);
        return str.toLowerCase().includes(q);
      });
  }, [items, search]);

  if (!sheet) return null;

  const handleCopyRow = (val: any, idx: number) => {
    const text = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1200);
  };

  const handleCopyAll = () => {
    const text = JSON.stringify(items, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheet.code}-datasheet.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          id={DATA_SHEET_SEMANTIC_ID.MODAL_PREVIEW}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[90vh] flex flex-col space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Table2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                    {sheet.name}
                  </Dialog.Title>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {sheet.code}
                  </span>
                </div>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {sheet.description || `${items.length} items stored in this dataset`}
                </Dialog.Description>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(sheet);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Variable Tokens Bar */}
          <div className="flex items-center justify-between p-2.5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/60 rounded-xl text-xs flex-wrap gap-2">
            <span className="text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Dynamic Tokens:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <DataSheetVariableTagBadge code={sheet.code} mode="asc" />
              <DataSheetVariableTagBadge code={sheet.code} mode="desc" />
              <DataSheetVariableTagBadge code={sheet.code} mode="random" />
              <DataSheetVariableTagBadge code={sheet.code} mode="index" index={0} />
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search among ${items.length} items...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                title="Copy all data as JSON"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'Copied All' : 'Copy All'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                title="Download JSON file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Items Table / List */}
          <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-[45vh] divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-sans">
                {items.length === 0 ? 'No items in this data sheet' : 'No items match your search'}
              </div>
            ) : (
              filteredItems.map(({ item, originalIndex }) => (
                <div
                  key={originalIndex}
                  className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-[11px] text-slate-400 w-8 shrink-0 select-none">
                      #{originalIndex}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 truncate select-all">
                      {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyRow(item, originalIndex)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-60 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Copy value"
                  >
                    {copiedIndex === originalIndex ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>
              Showing {filteredItems.length} of {items.length} items
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
