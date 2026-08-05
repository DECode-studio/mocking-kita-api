'use client';

import React from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Database,
  RotateCcw,
  Upload,
  Info,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useSettingsViewModel } from './useSettingsViewModel';

export const SettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    setImportModalOpen,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    handleReset,
  } = useSettingsViewModel();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Studio Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage local database persistence, theme preferences, and import/export tools
        </p>
      </div>

      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Sun className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Appearance & Visual Theme</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-600 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sun className="w-5 h-5 mx-auto text-amber-500" />
            <span className="block text-xs">Light Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
              theme === 'dark'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Moon className="w-5 h-5 mx-auto text-indigo-400" />
            <span className="block text-xs">Dark Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
              theme === 'system'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Laptop className="w-5 h-5 mx-auto text-slate-400" />
            <span className="block text-xs">System Theme</span>
          </button>
        </div>
      </div>

      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Database className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Local Database Engine</h2>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 text-xs font-mono">
          <span className="text-slate-400 block text-[10px] font-sans">Database Driver</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">SQLite Server Driver (WAL Mode)</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Import / Export JSON
          </button>
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Database to Seed
          </button>
        </div>
      </div>

      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Info className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Application Information</h2>
        </div>
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
          <p>
            <strong className="text-slate-900 dark:text-slate-100">Mock API Studio</strong> is built using a clean domain architecture with Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, and SQLite-backed persistence.
          </p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="Reset Database to Default Seed Data?"
        description="Are you sure you want to reset all mock projects, environments, and API endpoints back to default seed data? Current unsaved modifications will be replaced."
        confirmLabel="Reset Everything"
        variant="danger"
      />
    </div>
  );
};

export default SettingsView;
