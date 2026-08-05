import { create } from 'zustand';
import type { ThemeMode } from './theme-types';
import { getThemeSetting, setThemeSetting } from '@/src/core/http-client/settings-client';

export type { ThemeMode };

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
}

let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  setTheme: async (theme: ThemeMode) => {
    set({ theme });
    applyTheme(theme);
    try {
      await setThemeSetting(theme);
    } catch (err) {
      console.error('Failed to update theme setting cookie:', err);
    }
  },

  initTheme: async () => {
    try {
      const theme = await getThemeSetting();
      set({ theme });
      applyTheme(theme);
    } catch {
      applyTheme(get().theme || 'dark');
    }
  },
}));

function applyTheme(theme: ThemeMode) {
  if (typeof window === 'undefined') return;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  if (mediaQueryListener) {
    mediaQuery.removeEventListener('change', mediaQueryListener);
    mediaQueryListener = null;
  }

  const resolveIsDark = (t: ThemeMode) => {
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return mediaQuery.matches;
  };

  const isDark = resolveIsDark(theme);
  const root = document.documentElement;

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (theme === 'system') {
    mediaQueryListener = (e: MediaQueryListEvent) => {
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', mediaQueryListener);
  }
}

