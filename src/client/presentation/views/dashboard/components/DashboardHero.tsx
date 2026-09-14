'use client';


import React from 'react';
import { Plus } from 'lucide-react';
import { DASHBOARD_TEXT, DASHBOARD_SEMANTIC_ID } from '../constant';

interface DashboardHeroProps {
  onCreateProject: () => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  onCreateProject,
}) => {
  return (
    <div id={DASHBOARD_SEMANTIC_ID.HERO} className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-10 text-white shadow-2xl">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          {DASHBOARD_TEXT.HERO_BADGE}
        </div>

        <h1 className="font-display text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight">
          {DASHBOARD_TEXT.HERO_TITLE_PREFIX}
          <span className="text-gradient">{DASHBOARD_TEXT.HERO_TITLE_SUFFIX}</span>
        </h1>

        <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
          {DASHBOARD_TEXT.HERO_DESCRIPTION}
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onCreateProject}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            {DASHBOARD_TEXT.CREATE_PROJECT_BTN}
          </button>
        </div>
      </div>
    </div>
  );
};