'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  Settings,
  Sun,
  Moon,
  Plus,
  Code2,
  Zap,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useThemeStore } from '@/src/core/theme/themeStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../../core/utils/cn';
import { ROUTES } from '@/src/core/constants/routes';

export const AppSidebar: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const {
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: ROUTES.DASHBOARD,
      icon: LayoutDashboard,
      isActive: pathname === ROUTES.DASHBOARD,
    },
    {
      name: 'Projects',
      href: ROUTES.PROJECTS,
      icon: FolderGit2,
      isActive: pathname.startsWith(ROUTES.PROJECTS),
    },
    {
      name: 'Settings',
      href: ROUTES.SETTINGS,
      icon: Settings,
      isActive: pathname === ROUTES.SETTINGS,
    },
  ];

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-40 p-3 lg:p-4 transition-all duration-300 ease-in-out flex shrink-0',
        'lg:static lg:z-auto lg:h-screen lg:top-0',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <aside
        className={cn(
          'bg-slate-900 text-slate-100 border border-slate-800/90 rounded-2xl flex flex-col shadow-2xl shadow-slate-950/40 transition-all duration-300 ease-in-out h-full overflow-hidden',
          isSidebarCollapsed ? 'w-64 lg:w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            'px-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 transition-all duration-300',
            isSidebarCollapsed ? 'lg:py-3 lg:px-2 lg:flex-col lg:gap-2.5 lg:h-auto' : 'h-16'
          )}
        >
          <Link
            href={ROUTES.DASHBOARD}
            className={cn(
              'flex items-center gap-3 group overflow-hidden',
              isSidebarCollapsed && 'lg:justify-center lg:w-full'
            )}
            title="MockAPI Studio"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <div className="min-w-0 flex-1">
                <span className="font-display font-bold text-sm tracking-tight text-white block truncate">
                  MockAPI<span className="text-purple-400">Studio</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono block -mt-0.5 truncate">
                  Local Engine v1.0
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors shrink-0"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-purple-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-slate-200" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          <div>
            {!isSidebarCollapsed || isMobileSidebarOpen ? (
              <p className="px-2 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Main Navigation
              </p>
            ) : (
              <div className="my-2 border-t border-slate-800/60 mx-1" />
            )}

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    title={isSidebarCollapsed ? item.name : undefined}
                    className={cn(
                      'flex items-center gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group',
                      isSidebarCollapsed ? 'px-0 lg:justify-center' : 'px-3',
                      item.isActive
                        ? 'bg-slate-800/90 text-white shadow-md border border-slate-700/50'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        item.isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                      <>
                        <span className="truncate flex-1">{item.name}</span>
                        {item.isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Project Quick List Section */}
          <div>
            {!isSidebarCollapsed || isMobileSidebarOpen ? (
              <div className="flex items-center justify-between px-2 mb-2">
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Recent Projects
                </p>
                <button
                  type="button"
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
            ) : (
              <div className="my-2 border-t border-slate-800/60 mx-1" />
            )}

            <div className="space-y-1">
              <Link
                href={ROUTES.PROJECTS}
                onClick={() => setMobileSidebarOpen(false)}
                title={isSidebarCollapsed ? 'View All Projects' : undefined}
                className={cn(
                  'flex items-center gap-2 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors',
                  isSidebarCollapsed ? 'px-0 lg:justify-center' : 'px-2.5'
                )}
              >
                <Code2 className="w-4 h-4 shrink-0 text-slate-500" />
                {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                  <span className="truncate">View All Projects</span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between gap-2 shrink-0 bg-slate-900/50">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors',
              isSidebarCollapsed && 'lg:w-full lg:justify-center lg:px-0'
            )}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>

          {(!isSidebarCollapsed || isMobileSidebarOpen) && (
            <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 bg-slate-950/80 rounded border border-slate-800/80 shrink-0">
              JSON Local
            </span>
          )}
        </div>
      </aside>
    </div>
  );
};

export default AppSidebar;
