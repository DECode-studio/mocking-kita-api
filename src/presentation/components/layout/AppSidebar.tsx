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
} from 'lucide-react';
import { useThemeStore } from '@/src/core/theme/themeStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../../core/utils/cn';

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
        isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Mock API Studio
            </h1>
            <p className="text-[10px] text-purple-400 font-mono tracking-wider uppercase">LOCAL ENGINE</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <div>
          <p className="px-2 mb-2 text-[11px] font-semibold tracking-widest text-slate-400 uppercase font-mono">
            NAVIGATION
          </p>
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative',
                pathname === '/dashboard'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )}
            >
              <LayoutDashboard className={cn('w-4 h-4', pathname === '/dashboard' ? 'text-purple-400' : '')} />
              <span>Dashboard</span>
              {pathname === '/dashboard' && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
              )}
            </Link>

            <Link
              href="/projects"
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative',
                pathname.startsWith('/projects')
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )}
            >
              <FolderGit2 className={cn('w-4 h-4', pathname.startsWith('/projects') ? 'text-purple-400' : '')} />
              <span className="flex-1">Projects</span>
              {pathname.startsWith('/projects') && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
              )}
            </Link>

            <Link
              href="/settings"
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative',
                pathname === '/settings'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )}
            >
              <Settings className={cn('w-4 h-4', pathname === '/settings' ? 'text-purple-400' : '')} />
              <span>Settings</span>
              {pathname === '/settings' && (
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
                router.push('/projects?new=true');
              }}
              className="text-slate-400 hover:text-indigo-400 p-0.5 rounded hover:bg-slate-800 transition-colors"
              title="Add New Project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            <Link
              href="/projects"
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
