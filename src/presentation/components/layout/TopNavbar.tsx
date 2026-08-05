'use client';

import React from 'react';
import { Menu, Search, Download, Upload, Command } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

export const TopNavbar: React.FC = () => {
  const { toggleMobileSidebar, globalSearch, setGlobalSearch, setImportModalOpen } = useUIStore();

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

        {/* Right section: global search + import/export + user profile */}
        <div className="flex items-center gap-2.5">
          {/* Search input */}
          <div className="relative hidden md:block w-48 lg:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search endpoints, projects..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all"
            />
          </div>

          {/* Import/Export buttons */}
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Import or Export JSON Backup"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Import/Export</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* User profile dropdown */}
          <UserMenu />
        </div>
      </header>
    </div>
  );
};
