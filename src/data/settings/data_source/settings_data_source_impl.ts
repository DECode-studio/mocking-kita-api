import { apiRequest } from '@/src/core/http-client/api-client';
import { ThemeMode } from '@/src/domain/settings/entity/theme_mode';
import { SettingsDataSource } from './settings_data_source';

export class SettingsApiDataSource implements SettingsDataSource {
  async getTheme(): Promise<ThemeMode> {
    const res = await apiRequest<{ theme: ThemeMode }>('/api/settings');
    return res.theme;
  }

  async setTheme(theme: ThemeMode): Promise<ThemeMode> {
    const res = await apiRequest<{ theme: ThemeMode }>('/api/settings', {
      method: 'PUT',
      body: { theme },
    });
    return res.theme;
  }
}

export const settingsDataSource = new SettingsApiDataSource();
