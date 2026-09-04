'use client';

import React from 'react';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { createDatabaseResetUseCase } from '@/src/di/usecase_provider';
import { useSettings } from './hook/useSettings';
import { SETTINGS_TEXT, SETTINGS_SEMANTIC_ID } from './constant';
import {
  ThemeSettingsCard,
  DatabaseSettingsCard,
  DatabaseImportModal,
  OnboardingSettingsCard,
  AppInfoCard,
} from './components';

export const SettingsView: React.FC = () => {
  const databaseResetUseCase = createDatabaseResetUseCase();
  const {
    theme,
    setTheme,
    // Reset state
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    isResetting,
    handleReset,
    canResetDb,
    canBackupRestoreDb,
    // Download Backup
    isDownloading,
    downloadFormat,
    handleDownloadBackup,
    // Import Backup
    isImportModalOpen,
    setIsImportModalOpen,
    selectedFile,
    fileName,
    fileSize,
    fileSummary,
    importFileFormat,
    fileError,
    importMode,
    setImportMode,
    isImporting,
    handleFileChange,
    handleFileDrop,
    handleClearFile,
    handleApplyImport,
  } = useSettings(databaseResetUseCase);

  return (
    <div id={SETTINGS_SEMANTIC_ID.CONTAINER} className="space-y-8 w-full max-w-5xl mx-auto pb-10">
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

      {/* Database Engine & Backup Settings Card */}
      <DatabaseSettingsCard
        onDownloadBackupClick={handleDownloadBackup}
        isDownloading={isDownloading}
        downloadFormat={downloadFormat}
        onImportBackupClick={() => setIsImportModalOpen(true)}
        onResetConfirmClick={() => setIsResetConfirmOpen(true)}
        isResetting={isResetting}
        canResetDb={canResetDb}
        canBackupRestoreDb={canBackupRestoreDb}
      />

      {/* Onboarding Tour Settings Card */}
      <OnboardingSettingsCard />

      {/* Application Info Card */}
      <AppInfoCard />

      {/* Database Backup Import Modal */}
      <DatabaseImportModal
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        selectedFile={selectedFile}
        fileName={fileName}
        fileSize={fileSize}
        fileSummary={fileSummary}
        importFileFormat={importFileFormat}
        fileError={fileError}
        importMode={importMode}
        onImportModeChange={setImportMode}
        isImporting={isImporting}
        onFileChange={handleFileChange}
        onFileDrop={handleFileDrop}
        onClearFile={handleClearFile}
        onApplyImport={handleApplyImport}
      />

      {/* Database Reset Confirmation Dialog */}
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
