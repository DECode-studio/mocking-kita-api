import { create } from 'zustand';
import { SettingsService, type ThemeMode } from '../../data/resources/remote/settings-api-service';

interface SettingsState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'dark',

  setTheme: async (theme: ThemeMode) => {
    await SettingsService.setTheme(theme);
    set({ theme });
    applyTheme(theme);
  },

  initTheme: async () => {
    try {
      const theme = await SettingsService.getTheme();
      set({ theme });
      applyTheme(theme);
    } catch {
      applyTheme('dark');
    }
  },
}));

function applyTheme(theme: ThemeMode) {
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
