import { SettingsUseCaseImpl } from '@/src/domain/settings/usecase/settings_usecase';
import { settingsRepository } from './repository/settings_repository';
import { resetDatabaseRepository } from '@/src/infrastructure/database/reset_database_repository_impl';

export const settingsUseCase = new SettingsUseCaseImpl(settingsRepository, resetDatabaseRepository);
