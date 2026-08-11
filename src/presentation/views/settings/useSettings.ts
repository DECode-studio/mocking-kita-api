'use client';

import { useState } from 'react';
import { useThemeStore } from '@/src/core/theme/themeStore';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { DatabaseResetUseCase } from '@/src/domain/database/usecase/database_reset_usecase';

export function useSettings(databaseResetUseCase: DatabaseResetUseCase) {
  const { theme, setTheme } = useThemeStore();
  const { setImportModalOpen, addToast } = useUIStore();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleReset = async () => {
    await databaseResetUseCase.resetDatabase();
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
