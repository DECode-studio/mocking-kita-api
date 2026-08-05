import { ThemeMode } from '@/src/domain/settings/entity/theme_mode';

export interface SettingsDataSource {
  getTheme(): Promise<ThemeMode>;
  setTheme(theme: ThemeMode): Promise<ThemeMode>;
}
