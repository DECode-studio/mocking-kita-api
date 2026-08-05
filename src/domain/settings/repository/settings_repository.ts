import { ThemeMode } from '../entity/theme_mode';

export interface SettingsRepository {
  getTheme(): Promise<ThemeMode>;
  setTheme(theme: ThemeMode): Promise<ThemeMode>;
}
