import { SettingsUseCaseImpl } from '@/src/domain/settings/usecase/settings_usecase';
import { settingsRepository } from './repository/settings_repository';
import { databaseRepository } from '@/src/data/database/admin/database_repository_impl';

export const settingsUseCase = new SettingsUseCaseImpl(settingsRepository, databaseRepository);
