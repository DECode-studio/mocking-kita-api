'use client';

import React from 'react';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { createDatabaseResetUseCase } from '@/src/domain/database';
import { useSettingsViewModel } from './view_model/useSettingsViewModel';
import { SETTINGS_TEXT, SETTINGS_SEMANTIC_ID } from './constant';
import {
  ThemeSettingsCard,
  DatabaseSettingsCard,
  AppInfoCard,
} from './components';

export const SettingsView: React.FC = () => {
  const databaseResetUseCase = createDatabaseResetUseCase();
  const {
    theme,
    setTheme,
    setImportModalOpen,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    handleReset,
  } = useSettingsViewModel(databaseResetUseCase);

  return (
    <div id={SETTINGS_SEMANTIC_ID.CONTAINER} className="space-y-8 w-full">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {SETTINGS_TEXT.TITLE}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {SETTINGS_TEXT.SUBTITLE}
        </p>
      </div>

      {/* Theme Settings Card */}
      <ThemeSettingsCard theme={theme} onThemeChange={setTheme} />

      {/* Database Engine Settings Card */}
      <DatabaseSettingsCard
        onImportExportClick={() => setImportModalOpen(true)}
        onResetConfirmClick={() => setIsResetConfirmOpen(true)}
      />

      {/* Application Info Card */}
      <AppInfoCard />

      {/* Database Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleReset}
        title={SETTINGS_TEXT.RESET_DIALOG_TITLE}
        description={SETTINGS_TEXT.RESET_DIALOG_DESC}
        confirmLabel={SETTINGS_TEXT.RESET_DIALOG_CONFIRM}
        variant="danger"
      />
    </div>
  );
};

export default SettingsView;
