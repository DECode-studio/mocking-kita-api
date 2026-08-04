'use client';

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, User, Settings, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useRouter } from 'next/navigation';

export const UserMenu: React.FC = () => {
  const { session, logout } = useAuthStore();
  const router = useRouter();

  if (!session) return null;

  const handleLogout = () => {
    void logout().then(() => router.push('/sign-in'));
  };

  const initials = session.name
    ? session.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'US';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
              {session.name}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              @{session.username}
            </span>
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-xl z-50 text-xs text-slate-700 dark:text-slate-300 space-y-0.5 animate-in fade-in duration-150"
        >
          <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{session.name}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">@{session.username}</p>
            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-mono">
              <Shield className="w-3 h-3" />
              {session.role}
            </div>
          </div>

          <DropdownMenu.Item
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Account Settings</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          <DropdownMenu.Item
            onClick={handleLogout}
            className="flex items-center gap-2 px-2.5 py-2 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer outline-none font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
