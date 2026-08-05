import { SettingsRepository } from '@/src/domain/settings/repository/settings_repository';
import { ThemeMode } from '@/src/domain/settings/entity/theme_mode';
import { SettingsDataSource } from '../data_source/settings_data_source';
import { settingsDataSource } from '../data_source/settings_data_source_impl';

export class SettingsRepositoryImpl implements SettingsRepository {
  constructor(private readonly dataSource: SettingsDataSource = settingsDataSource) {}

  async getTheme(): Promise<ThemeMode> {
    return this.dataSource.getTheme();
  }

  async setTheme(theme: ThemeMode): Promise<ThemeMode> {
    return this.dataSource.setTheme(theme);
  }
}

export const settingsRepository = new SettingsRepositoryImpl();
