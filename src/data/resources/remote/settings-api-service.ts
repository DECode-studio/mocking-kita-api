import { apiRequest } from '@/src/core/http-client/api-client';

export type ThemeMode = 'light' | 'dark' | 'system';

export class SettingsService {
  static async getTheme(): Promise<ThemeMode> {
    const res = await apiRequest<{ theme: ThemeMode }>('/api/settings');
    return res.theme;
  }

  static async setTheme(theme: ThemeMode): Promise<ThemeMode> {
    const res = await apiRequest<{ theme: ThemeMode }>('/api/settings', {
      method: 'PUT',
      body: { theme },
    });
    return res.theme;
  }
}
