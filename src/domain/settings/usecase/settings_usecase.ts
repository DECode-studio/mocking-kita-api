import { ThemeMode } from '../entity/theme_mode';
import { SettingsRepository } from '../repository/settings_repository';
import { DatabaseResetRepository } from '@/src/domain/database/repository/database_reset_repository';

export interface SettingsUseCase {
  getTheme(): Promise<ThemeMode>;
  setTheme(theme: ThemeMode): Promise<ThemeMode>;
  resetDatabase(): Promise<void>;
}

export class SettingsUseCaseImpl implements SettingsUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly databaseRepository: DatabaseResetRepository
  ) {}

  getTheme(): Promise<ThemeMode> {
    return this.settingsRepository.getTheme();
  }

  setTheme(theme: ThemeMode): Promise<ThemeMode> {
    return this.settingsRepository.setTheme(theme);
  }

  resetDatabase(): Promise<void> {
    return this.databaseRepository.resetDatabase();
  }
}
