import { create } from 'zustand';
import type { ThemeMode } from './theme-types';
import { getThemeSetting, setThemeSetting } from '@/src/core/http-client/settings-client';

export type { ThemeMode };

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',

  setTheme: async (theme: ThemeMode) => {
    await setThemeSetting(theme);
    set({ theme });
    applyTheme(theme);
  },

  initTheme: async () => {
    try {
      const theme = await getThemeSetting();
      set({ theme });
      applyTheme(theme);
    } catch {
      applyTheme('dark');
    }
  },
}));

function applyTheme(theme: ThemeMode) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
