'use client';

import React, { useState, type DragEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Upload,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Loader2,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SETTINGS_TEXT, SETTINGS_SEMANTIC_ID } from '../constant';
import { FileSummary } from '../hook/useSettings';

interface DatabaseImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: File | null;
  fileName: string;
  fileSize: string | null;
  fileSummary: FileSummary | null;
  importFileFormat: FileSummary['format'] | null;
  fileError: string | null;
  importMode: 'merge' | 'replace';
  onImportModeChange: (mode: 'merge' | 'replace') => void;
  isImporting: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (file: File) => void;
  onClearFile: () => void;
  onApplyImport: () => void;
}

export const DatabaseImportModal: React.FC<DatabaseImportModalProps> = ({
  isOpen,
  onOpenChange,
  selectedFile,
  fileName,
  fileSize,
  fileSummary,
  importFileFormat,
  fileError,
  importMode,
  onImportModeChange,
  isImporting,
  onFileChange,
  onFileDrop,
  onClearFile,
  onApplyImport,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileDrop(file);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !isImporting && onOpenChange(open)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          id={SETTINGS_SEMANTIC_ID.IMPORT_BACKUP_MODAL}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 space-y-5 focus:outline-none animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto overflow-hidden"
        >
          {/* Full Loading Overlay */}
          {isImporting && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3.5 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm text-center px-8 animate-in fade-in duration-200">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {importFileFormat === 'sql' ? SETTINGS_TEXT.IMPORT_SQL_LOADING_TITLE : SETTINGS_TEXT.IMPORT_LOADING_TITLE}
                </h4>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {importFileFormat === 'sql' ? SETTINGS_TEXT.IMPORT_SQL_LOADING_DESC : SETTINGS_TEXT.IMPORT_LOADING_DESC}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span>
                  {importFileFormat === 'sql' ? SETTINGS_TEXT.IMPORT_SQL_LOADING_BADGE : SETTINGS_TEXT.IMPORT_LOADING_BADGE}
                </span>
              </div>
            </div>
          )}

          {/* Modal Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {SETTINGS_TEXT.IMPORT_MODAL_TITLE}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {SETTINGS_TEXT.IMPORT_MODAL_DESC}
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File Upload Zone / Selected File Card */}
          <div className="space-y-3">
            {!selectedFile ? (
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100/70 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {SETTINGS_TEXT.IMPORT_DROP_LABEL}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {SETTINGS_TEXT.IMPORT_SUPPORTS_LABEL}
                </span>
                <input
                  id={SETTINGS_SEMANTIC_ID.IMPORT_FILE_INPUT}
                  type="file"
                  accept=".sql,.json,application/json,application/sql,text/plain"
                  onChange={onFileChange}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {fileName}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </div>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {fileSize} • {fileSummary?.format === 'sql' ? 'Valid PostgreSQL SQL Script' : 'Valid JSON Backup'}
                      </span>
                    </div>
                  </div>
                  {!isImporting && (
                    <button
                      type="button"
                      onClick={onClearFile}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* File Contents Summary Badges */}
                {fileSummary && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    {fileSummary.format === 'sql' ? (
                      <>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60">
                          <FileCode className="w-3 h-3" />
                          SQL Script Dump
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
                          <Layers className="w-3 h-3" />
                          ~{fileSummary.statementsCount} SQL Statements
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {fileSummary.lineCount} Lines
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
                          <Layers className="w-3 h-3" />
                          {fileSummary.projects} Projects
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60">
                          <Sparkles className="w-3 h-3" />
                          {fileSummary.apis} APIs
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-amber-900/60">
                          🎯 {fileSummary.scenarios} Scenarios
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {fileError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="leading-snug">{fileError}</span>
              </div>
            )}
          </div>

          {/* Strategy Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
              {SETTINGS_TEXT.IMPORT_MODE_LABEL}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                id={SETTINGS_SEMANTIC_ID.IMPORT_MODE_MERGE_BTN}
                type="button"
                disabled={isImporting}
                onClick={() => onImportModeChange('merge')}
                className={`p-3 rounded-xl border text-left text-xs transition-all relative cursor-pointer ${
                  importMode === 'merge'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{SETTINGS_TEXT.IMPORT_MODE_MERGE}</span>
                  <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    Safe
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug block">
                  {SETTINGS_TEXT.IMPORT_MODE_MERGE_DESC}
                </span>
              </button>

              <button
                id={SETTINGS_SEMANTIC_ID.IMPORT_MODE_REPLACE_BTN}
                type="button"
                disabled={isImporting}
                onClick={() => onImportModeChange('replace')}
                className={`p-3 rounded-xl border text-left text-xs transition-all relative cursor-pointer ${
                  importMode === 'replace'
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/50 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{SETTINGS_TEXT.IMPORT_MODE_REPLACE}</span>
                  <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                    Wipe
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug block">
                  {SETTINGS_TEXT.IMPORT_MODE_REPLACE_DESC}
                </span>
              </button>
            </div>

            {/* Warning when Replace is active */}
            {importMode === 'replace' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl text-xs animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span className="leading-snug">{SETTINGS_TEXT.IMPORT_REPLACE_WARNING}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              id={SETTINGS_SEMANTIC_ID.IMPORT_CANCEL_BTN}
              type="button"
              disabled={isImporting}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {SETTINGS_TEXT.IMPORT_CANCEL_BTN}
            </button>

            <button
              id={SETTINGS_SEMANTIC_ID.APPLY_IMPORT_BTN}
              type="button"
              onClick={onApplyImport}
              disabled={!selectedFile || !!fileError || isImporting}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
                importMode === 'replace'
                  ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed'
              }`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {SETTINGS_TEXT.IMPORTING_BTN}
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  {SETTINGS_TEXT.APPLY_IMPORT_BTN}
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
