import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { FAQ_TEXT } from '../constant/faqText';

export const FaqHero: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 lg:p-10 border border-slate-800 shadow-xl">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {FAQ_TEXT.TAG}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight bg-linear-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            {FAQ_TEXT.TITLE}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed font-normal">
            {FAQ_TEXT.SUBTITLE}
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/85 border border-slate-700/50 text-purple-400 shadow-lg">
          <BookOpen className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};

export default FaqHero;
