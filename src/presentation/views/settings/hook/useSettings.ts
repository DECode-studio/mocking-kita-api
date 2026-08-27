'use client';

import { useState } from 'react';
import { useThemeStore } from '@/src/core/theme/themeStore';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { useAuthStore } from '@/src/presentation/stores/authStore';
import { canResetDatabase } from '@/src/core/constants/roles';
import { DatabaseResetUseCase } from '@/src/domain/database/usecase/database_reset_usecase';

export function useSettings(databaseResetUseCase: DatabaseResetUseCase) {
  const { theme, setTheme } = useThemeStore();
  const { setImportModalOpen, addToast } = useUIStore();
  const { session } = useAuthStore();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const canResetDb = canResetDatabase(session?.role);

  const handleReset = async () => {
    if (!canResetDb) {
      addToast({
        type: 'error',
        title: 'Permission Denied',
        description: 'Only Admin and Manager roles are allowed to reset the database.',
      });
      setIsResetConfirmOpen(false);
      return;
    }

    try {
      await databaseResetUseCase.resetDatabase();
      addToast({
        type: 'warning',
        title: 'Database Reset',
        description: 'Reset local database to initial seed data.',
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Database Reset Failed',
        description: error?.message || 'Failed to reset database.',
      });
    } finally {
      setIsResetConfirmOpen(false);
    }
  };

  return {
    theme,
    setTheme,
    setImportModalOpen,
    addToast,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    handleReset,
    canResetDb,
  };
}
