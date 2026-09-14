'use client';


import React from 'react';
import { Menu } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

export const TopNavbar: React.FC = () => {
  const { toggleMobileSidebar } = useUIStore();

  return (
    <div className="sticky top-0 z-30 p-3 lg:pt-4 lg:px-6 lg:pb-0">
      <header className="h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-2xl px-4 flex items-center justify-between gap-4 shadow-lg shadow-slate-950/5 dark:shadow-black/40">
        {/* Left section: mobile trigger + breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Breadcrumbs />
        </div>

        {/* Right section: user profile */}
        <div className="flex items-center gap-2.5">
          <UserMenu />
        </div>
      </header>
    </div>
  );
};