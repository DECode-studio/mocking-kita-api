'use client';

import React from 'react';
import { Database, Upload, RotateCcw } from 'lucide-react';
import { SETTINGS_TEXT, SETTINGS_SEMANTIC_ID } from '../constant';

interface DatabaseSettingsCardProps {
  onImportExportClick: () => void;
  onResetConfirmClick: () => void;
}

export const DatabaseSettingsCard: React.FC<DatabaseSettingsCardProps> = ({
  onImportExportClick,
  onResetConfirmClick,
}) => {
  return (
    <div id={SETTINGS_SEMANTIC_ID.DATABASE_CARD} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Database className="w-4 h-4 text-emerald-500" />
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{SETTINGS_TEXT.DATABASE_TITLE}</h2>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 text-xs font-mono">
        <span className="text-slate-400 block text-[10px] font-sans">{SETTINGS_TEXT.DATABASE_DRIVER_LABEL}</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{SETTINGS_TEXT.DATABASE_DRIVER_NAME}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          id={SETTINGS_SEMANTIC_ID.IMPORT_EXPORT_BTN}
          type="button"
          onClick={onImportExportClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          {SETTINGS_TEXT.IMPORT_EXPORT_BTN}
        </button>
        <button
          id={SETTINGS_SEMANTIC_ID.RESET_DATABASE_BTN}
          type="button"
          onClick={onResetConfirmClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {SETTINGS_TEXT.RESET_DATABASE_BTN}
        </button>
      </div>
    </div>
  );
};
