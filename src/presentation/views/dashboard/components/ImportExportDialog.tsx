'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { createDatabaseSnapshotUseCase } from '@/src/domain/database';
import { useImportExportDialogViewModel } from '../view_model/useImportExportDialogViewModel';

export const ImportExportDialog: React.FC = () => {
  const databaseSnapshotUseCase = createDatabaseSnapshotUseCase();
  const {
    isImportModalOpen,
    setImportModalOpen,
    importedJson,
    importMode,
    setImportMode,
    fileError,
    fileName,
    handleExport,
    handleFileChange,
    handleApplyImport,
  } = useImportExportDialogViewModel(databaseSnapshotUseCase);

  return (
    <Dialog.Root open={isImportModalOpen} onOpenChange={setImportModalOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-5 focus:outline-none animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Import / Export Mock API Database
              </Dialog.Title>
            </div>
            <button
              onClick={() => setImportModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Export Current Configuration</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Download a full backup JSON containing all projects and API endpoints.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Import Configuration File
            </h4>

            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {fileName ? fileName : 'Click or drop a .json backup file here'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">Supports JSON files exported from Mock API Studio</span>
              <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </label>

            {fileError && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {importedJson && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Import File Summary
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-slate-400 block text-[10px]">Projects</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{importedJson.projects?.length || 0}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-slate-400 block text-[10px]">Environments</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{importedJson.environments?.length || 0}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-slate-400 block text-[10px]">APIs</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{importedJson.apiCollections?.length || 0}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-slate-400 block text-[10px]">Request Scenarios</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{importedJson.requestScenarios?.length || 0}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-slate-400 block text-[10px]">Response Scenarios</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{importedJson.responseScenarios?.length || 0}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Import Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('merge')}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                        importMode === 'merge'
                          ? 'border-indigo-600 bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="block font-medium">Merge Data</span>
                      <span className="text-[10px] text-slate-500 font-normal">Appends data & prevents ID collisions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                        importMode === 'replace'
                          ? 'border-indigo-600 bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="block font-medium">Replace All</span>
                      <span className="text-[10px] text-slate-500 font-normal">Wipes all current data first</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                  Apply Import
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
