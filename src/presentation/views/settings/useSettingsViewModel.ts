'use client';

import { useState } from 'react';
import { useThemeStore } from '@/src/core/theme/themeStore';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { SettingsUseCaseImpl } from '@/src/domain/settings/usecase/settings_usecase';
import { settingsRepository } from '@/src/data/settings/repository/settings_repository';
import { databaseRepository } from '@/src/data/database/database_repository_impl';

const settingsUseCase = new SettingsUseCaseImpl(settingsRepository, databaseRepository);

export function useSettingsViewModel() {
  const { theme, setTheme } = useThemeStore();
  const { setImportModalOpen, addToast } = useUIStore();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleReset = async () => {
    await settingsUseCase.resetDatabase();
    addToast({
      type: 'warning',
      title: 'Database Reset',
      description: 'Reset local database to initial seed data.',
    });
    setIsResetConfirmOpen(false);
  };

  return {
    theme,
    setTheme,
    setImportModalOpen,
    addToast,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    handleReset,
  };
}
