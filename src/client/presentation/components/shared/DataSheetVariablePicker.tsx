'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Table2, X, Copy, Check, Plus, Search, Sparkles } from 'lucide-react';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';

interface DataSheetVariablePickerProps {
  projectId?: string;
  onInsert?: (token: string) => void;
  triggerClassName?: string;
  buttonLabel?: string;
}

export const DataSheetVariablePicker: React.FC<DataSheetVariablePickerProps> = ({
  projectId,
  onInsert,
  triggerClassName = '',
  buttonLabel = 'Data Sheet Variables',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sheets, setSheets] = useState<DataSheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSheets = async () => {
      setIsLoading(true);
      try {
        const useCase = getService(CLIENT_DI_TOKENS.dataSheetUseCase);
        const list = await useCase.getAll({ projectId: projectId || undefined });
        setSheets(list.filter((s) => s.status && !s.deletedAt));
      } catch (err) {
        console.error('Failed to load data sheets for picker', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSheets();
  }, [isOpen, projectId]);

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  const handleInsert = (token: string) => {
    if (onInsert) {
      onInsert(token);
      setIsOpen(false);
    } else {
      handleCopy(token);
    }
  };

  const filteredSheets = sheets.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 ${triggerClassName}`}
      >
        <Table2 className="w-3.5 h-3.5" />
        <span>{buttonLabel}</span>
      </button>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[85vh] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Table2 className="w-4 h-4" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                    Data Sheet Variables
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                    Select a data sheet token to insert or copy
                  </Dialog.Description>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search data sheets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh]">
              {isLoading ? (
                <p className="text-xs text-slate-400 text-center py-8">Loading data sheets...</p>
              ) : filteredSheets.length === 0 ? (
                <div className="text-center py-8 space-y-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No active data sheets available
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Create a Data Sheet from the &quot;Data Sheets&quot; menu first.
                  </p>
                </div>
              ) : (
                filteredSheets.map((sheet) => {
                  const ascToken = `{{datasheet.${sheet.code}.asc}}`;
                  const descToken = `{{datasheet.${sheet.code}.desc}}`;
                  const randomToken = `{{datasheet.${sheet.code}.random}}`;
                  const indexToken = `{{datasheet.${sheet.code}[0]}}`;
                  const count = Array.isArray(sheet.data) ? sheet.data.length : 0;

                  return (
                    <div
                      key={sheet.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {sheet.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {sheet.code}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {count} {count === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {/* ASC button */}
                        <div className="flex items-center rounded-lg border border-purple-200 dark:border-purple-800/80 overflow-hidden text-[11px]">
                          <span className="font-mono px-2 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                            {ascToken}
                          </span>
                          {onInsert ? (
                            <button
                              type="button"
                              onClick={() => handleInsert(ascToken)}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Insert
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCopy(ascToken)}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors flex items-center gap-1"
                            >
                              {copiedToken === ascToken ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              Copy
                            </button>
                          )}
                        </div>

                        {/* DESC button */}
                        <button
                          type="button"
                          onClick={() => (onInsert ? handleInsert(descToken) : handleCopy(descToken))}
                          title={`DESC (backward): ${descToken}`}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          .desc
                        </button>

                        {/* Random button */}
                        <button
                          type="button"
                          onClick={() => (onInsert ? handleInsert(randomToken) : handleCopy(randomToken))}
                          title={`Random: ${randomToken}`}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          .random
                        </button>

                        {/* Index 0 button */}
                        <button
                          type="button"
                          onClick={() => (onInsert ? handleInsert(indexToken) : handleCopy(indexToken))}
                          title={`Fixed Index: ${indexToken}`}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          [0]
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Supports sequential .asc, .desc, .random, or fixed [index]</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
