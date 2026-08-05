'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  Settings,
  Terminal,
  Sun,
  Moon,
  Plus,
  Layers,
  Globe,
  ChevronRight,
  Code2,
  Zap,
  X,
} from 'lucide-react';
import { useThemeStore } from '@/src/core/theme/themeStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../../core/utils/cn';
import { ROUTES } from '@/src/core/constants/routes';

export const AppSidebar: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div>
            <span className="font-display font-bold text-sm tracking-tight text-white block">
              MockAPI<span className="text-purple-400">Studio</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
              Local Engine v1.0
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <p className="px-2 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Main Navigation
          </p>
          <nav className="space-y-1">
            <Link
              href={ROUTES.DASHBOARD}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative',
                pathname === ROUTES.DASHBOARD
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )}
            >
              <LayoutDashboard className={cn('w-4 h-4', pathname === ROUTES.DASHBOARD ? 'text-purple-400' : '')} />
              <span>Dashboard</span>
              {pathname === ROUTES.DASHBOARD && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
              )}
            </Link>

            <Link
              href={ROUTES.PROJECTS}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative',
                pathname.startsWith(ROUTES.PROJECTS)
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )}
            >
              <FolderGit2 className={cn('w-4 h-4', pathname.startsWith(ROUTES.PROJECTS) ? 'text-purple-400' : '')} />
              <span className="flex-1">Projects</span>
              {pathname.startsWith(ROUTES.PROJECTS) && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
              )}
            </Link>

            <Link
              href={ROUTES.SETTINGS}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative',
                pathname === ROUTES.SETTINGS
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )}
            >
              <Settings className={cn('w-4 h-4', pathname === ROUTES.SETTINGS ? 'text-purple-400' : '')} />
              <span>Settings</span>
              {pathname === ROUTES.SETTINGS && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
              )}
            </Link>
          </nav>
        </div>

        {/* Project Quick List */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Recent Projects
            </p>
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
                router.push(`${ROUTES.PROJECTS}?new=true`);
              }}
              className="text-slate-400 hover:text-indigo-400 p-0.5 rounded hover:bg-slate-800 transition-colors"
              title="Add New Project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            <Link
              href={ROUTES.PROJECTS}
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Code2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">View All Projects</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
          JSON Local
        </span>
      </div>
    </aside>
  );
};
