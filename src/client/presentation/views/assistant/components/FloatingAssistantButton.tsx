'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAIStore } from '@/src/client/presentation/stores/aiStore';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/src/core/constants/routes';
import { ASSISTANT_SEMANTIC_ID } from '../constant';

export const FloatingAssistantButton: React.FC = () => {
  const { toggleDrawer, isDrawerOpen } = useAIStore();
  const pathname = usePathname();

  // Do not show floating button if already on the full assistant page
  if (pathname === ROUTES.ASSISTANT || pathname.startsWith('/assistant')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        id={ASSISTANT_SEMANTIC_ID.FLOATING_BTN}
        type="button"
        onClick={toggleDrawer}
        title="Buka Mocking Kita AI Assistant"
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-linear-to-r from-purple-600 via-indigo-600 to-purple-600 bg-size-[200%_auto] hover:bg-right text-white shadow-2xl shadow-purple-600/40 hover:shadow-purple-600/60 border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <span className="absolute -inset-1 rounded-full bg-purple-500/30 blur-md group-hover:bg-purple-500/50 transition-all -z-10 animate-pulse" />

        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white animate-spin-slow" />
        </div>

        <span className="text-xs font-bold tracking-wide">
          {isDrawerOpen ? 'Tutup Assistant' : 'AI Assistant'}
        </span>

        <span className="w-2 h-2 rounded-full bg-emerald-400 border border-white/40 shadow-xs" />
      </button>
    </div>
  );
};
