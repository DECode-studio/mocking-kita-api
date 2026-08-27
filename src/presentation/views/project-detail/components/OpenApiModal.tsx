'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Download, Upload, X, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';
import {  createProjectUseCase  } from '@/src/di/usecase_provider';
import { useOpenApi } from '../useOpenApi';
import { PROJECT_DETAIL_TEXT } from '../constant';

interface OpenApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const OpenApiModal: React.FC<OpenApiModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const projectUseCase = createProjectUseCase();

  const {
    activeTab,
    changeTab,
    importMode,
    setImportMode,
    jsonText,
    setJsonText,
    loading,
    errorMsg,
    successMsg,
    handleExport,
    handleFileUpload,
    handleImport,
  } = useOpenApi({
    projectId,
    projectName,
    onClose,
    projectUseCase,
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <Dialog.Title className="text-base font-bold text-slate-900 dark:text-slate-100">
                {PROJECT_DETAIL_TEXT.OPENAPI_MODAL_TITLE}
              </Dialog.Title>
            </div>
            <Dialog.Close onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <p className="text-xs text-slate-500">
            {PROJECT_DETAIL_TEXT.OPENAPI_MODAL_DESC(projectName)}
          </p>

          {/* Tabs header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
            <button
              type="button"
              onClick={() => changeTab('export')}
              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'export'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" /> {PROJECT_DETAIL_TEXT.OPENAPI_TAB_EXPORT}
            </button>
            <button
              type="button"
              onClick={() => changeTab('import')}
              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'import'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> {PROJECT_DETAIL_TEXT.OPENAPI_TAB_IMPORT}
            </button>
          </div>

          {/* Error / Success Notifications */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'export' ? (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-semibold">{PROJECT_DETAIL_TEXT.OPENAPI_EXPORT_FORMAT_LABEL}</div>
                <div>Includes all collections, endpoints, request parameters, and response scenarios for this project.</div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  {loading ? 'Exporting...' : PROJECT_DETAIL_TEXT.OPENAPI_BTN_EXPORT}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Import Mode
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setImportMode('upsert')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      importMode === 'upsert'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>Upsert</span>
                      <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded font-bold">Default</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Update existing & insert new</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      importMode === 'merge'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div>Merge</div>
                    <div className="text-[10px] text-slate-500 font-normal">Add all endpoints as new</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      importMode === 'replace'
                        ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div>Replace</div>
                    <div className="text-[10px] text-slate-500 font-normal">Overwrite all endpoints</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {PROJECT_DETAIL_TEXT.OPENAPI_UPLOAD_OR_PASTE_LABEL}
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300 mb-2"
                />
                <textarea
                  rows={5}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={PROJECT_DETAIL_TEXT.OPENAPI_PLACEHOLDER_JSON}
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading || !jsonText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {loading ? PROJECT_DETAIL_TEXT.OPENAPI_BTN_IMPORTING : PROJECT_DETAIL_TEXT.OPENAPI_BTN_IMPORT}
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
