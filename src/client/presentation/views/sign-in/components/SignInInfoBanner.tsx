'use client';


import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { SIGN_IN_TEXT, SIGN_IN_SEMANTIC_ID } from '../constant';

export const SignInInfoBanner: React.FC = () => {
  return (
    <div id={SIGN_IN_SEMANTIC_ID.INFO_BANNER} className="p-4 bg-slate-900/90 border border-purple-500/30 rounded-2xl space-y-2.5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
        <ShieldAlert className="w-4 h-4 text-purple-400" />
        {SIGN_IN_TEXT.AUTH_INFO_TITLE}
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        {SIGN_IN_TEXT.AUTH_INFO_DESC}
      </p>
    </div>
  );
};