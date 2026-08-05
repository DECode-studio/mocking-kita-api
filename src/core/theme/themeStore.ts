import { create } from 'zustand';
import { ThemeMode } from '@/src/domain/settings/entity/theme_mode';
import { settingsRepository } from '@/src/data/settings/repository/settings_repository';

export type { ThemeMode };

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',

  setTheme: async (theme: ThemeMode) => {
    await settingsRepository.setTheme(theme);
    set({ theme });
    applyTheme(theme);
  },

  initTheme: async () => {
    try {
      const theme = await settingsRepository.getTheme();
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
