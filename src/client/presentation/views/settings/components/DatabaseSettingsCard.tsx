'use client';


import React from 'react';
import { Database, Download, Upload, RotateCcw, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SETTINGS_TEXT, SETTINGS_SEMANTIC_ID } from '../constant';

interface DatabaseSettingsCardProps {
  onDownloadBackupClick: (format: 'sql' | 'json') => void;
  isDownloading?: boolean;
  downloadFormat?: 'sql' | 'json';
  onImportBackupClick: () => void;
  onResetConfirmClick: () => void;
  isResetting?: boolean;
  canResetDb?: boolean;
  canBackupRestoreDb?: boolean;
  onImportExportClick?: () => void;
}

export const DatabaseSettingsCard: React.FC<DatabaseSettingsCardProps> = ({
  onDownloadBackupClick,
  isDownloading = false,
  downloadFormat = 'sql',
  onImportBackupClick,
  onResetConfirmClick,
  isResetting = false,
  canResetDb = false,
  canBackupRestoreDb = false,
}) => {
  return (
    <div
      id={SETTINGS_SEMANTIC_ID.DATABASE_CARD}
      className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {SETTINGS_TEXT.DATABASE_TITLE}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {SETTINGS_TEXT.DATABASE_DRIVER_NAME}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{SETTINGS_TEXT.DATABASE_STATUS_ACTIVE}</span>
        </div>
      </div>

      {/* Driver Info Display */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-sans font-medium uppercase tracking-wider">
            {SETTINGS_TEXT.DATABASE_DRIVER_LABEL}
          </span>
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">
            {SETTINGS_TEXT.DATABASE_DRIVER_NAME}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Prisma 6 Client & PostgreSQL Schema</span>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            {SETTINGS_TEXT.DATABASE_BACKUP_SECTION}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {SETTINGS_TEXT.DATABASE_BACKUP_SECTION_DESC}
          </p>
        </div>

        {!canBackupRestoreDb && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{SETTINGS_TEXT.RESTRICTED_BACKUP_RESTORE_DESC}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Download Backup Card */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl flex flex-col justify-between space-y-4 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-colors">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {SETTINGS_TEXT.DOWNLOAD_BACKUP_TITLE}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {SETTINGS_TEXT.DOWNLOAD_BACKUP_DESC}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                id={SETTINGS_SEMANTIC_ID.DOWNLOAD_BACKUP_BTN}
                type="button"
                onClick={() => onDownloadBackupClick('sql')}
                disabled={!canBackupRestoreDb || isDownloading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:bg-indigo-400 dark:disabled:bg-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isDownloading && downloadFormat === 'sql' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{SETTINGS_TEXT.DOWNLOAD_BACKUP_LOADING}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{SETTINGS_TEXT.DOWNLOAD_BACKUP_SQL_BTN}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onDownloadBackupClick('json')}
                disabled={!canBackupRestoreDb || isDownloading}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer"
                title="Download JSON Snapshot backup"
              >
                {isDownloading && downloadFormat === 'json' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>{SETTINGS_TEXT.DOWNLOAD_BACKUP_JSON_BTN}</span>
                )}
              </button>
            </div>
          </div>

          {/* Import Backup Card */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl flex flex-col justify-between space-y-4 hover:border-purple-200 dark:hover:border-purple-900/60 transition-colors">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Upload className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {SETTINGS_TEXT.IMPORT_BACKUP_TITLE}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {SETTINGS_TEXT.IMPORT_BACKUP_DESC}
              </p>
            </div>

            <div>
              <button
                id={SETTINGS_SEMANTIC_ID.IMPORT_BACKUP_BTN}
                type="button"
                onClick={onImportBackupClick}
                disabled={!canBackupRestoreDb}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer active:scale-[0.99]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{SETTINGS_TEXT.IMPORT_BACKUP_BTN}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Database Reset */}
      {canResetDb && (
        <div className="pt-2">
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>{SETTINGS_TEXT.RESET_DATABASE_TITLE}</span>
              </div>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 leading-snug">
                {SETTINGS_TEXT.RESET_DATABASE_DESC}
              </p>
            </div>

            <button
              id={SETTINGS_SEMANTIC_ID.RESET_DATABASE_BTN}
              type="button"
              onClick={onResetConfirmClick}
              disabled={isResetting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.99] disabled:bg-rose-400 rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              {isResetting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>{SETTINGS_TEXT.RESET_DATABASE_BTN}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};