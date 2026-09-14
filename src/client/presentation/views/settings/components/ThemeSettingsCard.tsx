'use client';


import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { ThemeMode } from '@/src/core/theme/themeStore';
import { SETTINGS_TEXT, SETTINGS_SEMANTIC_ID } from '../constant';

interface ThemeSettingsCardProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const ThemeSettingsCard: React.FC<ThemeSettingsCardProps> = ({ theme, onThemeChange }) => {
  return (
    <div id={SETTINGS_SEMANTIC_ID.THEME_CARD} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Sun className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{SETTINGS_TEXT.THEME_TITLE}</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onThemeChange('light')}
          className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
            theme === 'light'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-600 font-bold'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Sun className="w-5 h-5 mx-auto text-amber-500" />
          <span className="block text-xs">{SETTINGS_TEXT.LIGHT_MODE}</span>
        </button>
        <button
          type="button"
          onClick={() => onThemeChange('dark')}
          className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
            theme === 'dark'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-400 font-bold'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Moon className="w-5 h-5 mx-auto text-indigo-400" />
          <span className="block text-xs">{SETTINGS_TEXT.DARK_MODE}</span>
        </button>
        <button
          type="button"
          onClick={() => onThemeChange('system')}
          className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
            theme === 'system'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-400 font-bold'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Laptop className="w-5 h-5 mx-auto text-slate-400" />
          <span className="block text-xs">{SETTINGS_TEXT.SYSTEM_THEME}</span>
        </button>
      </div>
    </div>
  );
};