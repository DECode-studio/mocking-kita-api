'use client';

import { useState } from 'react';
import { useDatabaseStore } from '@/src/presentation/stores/databaseStore';
import { useSettingsStore } from '@/src/presentation/stores/settingsStore';
import { useUIStore } from '@/src/presentation/stores/uiStore';

export function useSettingsViewModel() {
  const { theme, setTheme } = useSettingsStore();
  const { db, resetDatabase } = useDatabaseStore();
  const { setImportModalOpen, addToast } = useUIStore();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const rawSize = JSON.stringify(db).length;
  const kbSize = (rawSize / 1024).toFixed(2);

  const handleReset = async () => {
    await resetDatabase();
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
    db,
    resetDatabase,
    setImportModalOpen,
    addToast,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    rawSize,
    kbSize,
    handleReset,
  };
}
