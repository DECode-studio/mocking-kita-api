'use client';


import React from 'react';
import { Info } from 'lucide-react';
import { SETTINGS_TEXT, SETTINGS_SEMANTIC_ID } from '../constant';

export const AppInfoCard: React.FC = () => {
  return (
    <div id={SETTINGS_SEMANTIC_ID.APP_INFO_CARD} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <Info className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{SETTINGS_TEXT.APP_INFO_TITLE}</h2>
      </div>
      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
        <p>{SETTINGS_TEXT.APP_INFO_DESC}</p>
      </div>
    </div>
  );
};