'use client';


import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Download, Upload, FileText, AlertCircle, X } from 'lucide-react';
import { useImportExportDialog } from '../hook/useImportExportDialog';
import { DASHBOARD_TEXT, DASHBOARD_SEMANTIC_ID } from '../constant';

export const ImportExportDialog: React.FC = () => {
  const {
    isImportModalOpen,
    setImportModalOpen,
    importMode,
    setImportMode,
    fileError,
    fileName,
    isProcessing,
    handleExport,
    handleFileChange,
    handleApplyImport,
  } = useImportExportDialog();

  return (
    <Dialog.Root open={isImportModalOpen} onOpenChange={(open) => !isProcessing && setImportModalOpen(open)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content id={DASHBOARD_SEMANTIC_ID.IMPORT_EXPORT_DIALOG} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-5 focus:outline-none animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {DASHBOARD_TEXT.IMPORT_EXPORT_DIALOG_TITLE}
              </Dialog.Title>
            </div>
            <button
              onClick={() => setImportModalOpen(false)}
              disabled={isProcessing}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{DASHBOARD_TEXT.EXPORT_CONFIG_TITLE}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {DASHBOARD_TEXT.EXPORT_CONFIG_DESC}
                </p>
              </div>
              <button
                id={DASHBOARD_SEMANTIC_ID.EXPORT_BTN}
                type="button"
                onClick={handleExport}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                {DASHBOARD_TEXT.EXPORT_JSON_BTN}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {DASHBOARD_TEXT.IMPORT_CONFIG_TITLE}
            </h4>

            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {fileName ? fileName : DASHBOARD_TEXT.IMPORT_DROP_LABEL}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">{DASHBOARD_TEXT.IMPORT_SUPPORTS_LABEL}</span>
              <input id={DASHBOARD_SEMANTIC_ID.IMPORT_FILE_INPUT} type="file" accept=".json" onChange={handleFileChange} disabled={isProcessing} className="hidden" />
            </label>

            {fileError && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {DASHBOARD_TEXT.IMPORT_MODE_LABEL}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  disabled={isProcessing}
                  className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                    importMode === 'merge'
                      ? 'border-indigo-600 bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block font-medium">{DASHBOARD_TEXT.IMPORT_MODE_MERGE}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{DASHBOARD_TEXT.IMPORT_MODE_MERGE_DESC}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  disabled={isProcessing}
                  className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                    importMode === 'replace'
                      ? 'border-indigo-600 bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block font-medium">{DASHBOARD_TEXT.IMPORT_MODE_REPLACE}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{DASHBOARD_TEXT.IMPORT_MODE_REPLACE_DESC}</span>
                </button>
              </div>
            </div>

            <button
              id={DASHBOARD_SEMANTIC_ID.APPLY_IMPORT_BTN}
              type="button"
              onClick={handleApplyImport}
              disabled={isProcessing || !fileName || !!fileError}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {DASHBOARD_TEXT.APPLY_IMPORT_BTN}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};