'use client';

import React from 'react';
import { Terminal } from 'lucide-react';
import { SIGN_IN_TEXT, SIGN_IN_SEMANTIC_ID } from '../constant';

export const SignInHeroPanel: React.FC = () => {
  return (
    <div id={SIGN_IN_SEMANTIC_ID.HERO_PANEL} className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950 border-r border-slate-800 p-12 flex-col justify-between">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
          <Terminal className="w-5 h-5" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight text-white">{SIGN_IN_TEXT.TITLE}</span>
      </div>

      <div className="relative z-10 max-w-lg space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          {SIGN_IN_TEXT.HERO_BADGE}
        </div>

        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-white">
          {SIGN_IN_TEXT.HERO_TITLE_PREFIX}
          <span className="text-gradient">{SIGN_IN_TEXT.HERO_TITLE_SUFFIX}</span>
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed font-sans">
          {SIGN_IN_TEXT.HERO_DESCRIPTION}
        </p>
      </div>

      <div className="relative z-10 pt-8 border-t border-slate-900 flex items-center gap-6 text-xs text-slate-500 font-mono">
        <span>{SIGN_IN_TEXT.HERO_FEATURE_1}</span>
        <span>{SIGN_IN_TEXT.HERO_FEATURE_2}</span>
        <span>{SIGN_IN_TEXT.HERO_FEATURE_3}</span>
      </div>
    </div>
  );
};
