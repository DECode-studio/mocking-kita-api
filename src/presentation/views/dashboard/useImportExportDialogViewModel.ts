'use client';

import { useState, type ChangeEvent } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { getErrorMessage } from '../../../core/utils/error';
import { DatabaseSnapshotUseCase } from '@/src/domain/database/usecase/database_snapshot_usecase';

export function useImportExportDialogViewModel(databaseSnapshotUseCase: DatabaseSnapshotUseCase) {
  const { isImportModalOpen, setImportModalOpen, addToast } = useUIStore();

  const [importedJson, setImportedJson] = useState<MockApiDatabase | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleExport = async () => {
    try {
      const db = await databaseSnapshotUseCase.getDatabase();
      const dataStr = JSON.stringify(db, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const now = new Date();
      const YYYY = now.getFullYear();
      const MM = String(now.getMonth() + 1).padStart(2, '0');
      const DD = String(now.getDate()).padStart(2, '0');
      const HH = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      link.href = url;
      link.download = `mock-api-studio-backup-${YYYY}-${MM}-${DD}-${HH}${mm}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        title: 'Database Exported',
        description: 'Mock API configuration exported successfully as JSON file.',
      });
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: getErrorMessage(error, 'Could not export database'),
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setFileError('Invalid file type. Please upload a .json file.');
      setImportedJson(null);
      return;
    }

    setFileName(file.name);
    setFileError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as MockApiDatabase;

        if (!parsed.projects || !Array.isArray(parsed.projects)) {
          setFileError('Invalid Mock API Database structure. Missing projects array.');
          setImportedJson(null);
          return;
        }

        setImportedJson(parsed);
      } catch (error: unknown) {
        setFileError('Failed to parse JSON file. Syntax error detected.');
        setImportedJson(null);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = async () => {
    if (!importedJson) return;

    try {
      await databaseSnapshotUseCase.importDatabase(importedJson, importMode);
      addToast({
        type: 'success',
        title: 'Import Successful',
        description: `Successfully ${importMode === 'replace' ? 'replaced' : 'merged'} database configurations.`,
      });
      setImportedJson(null);
      setFileName('');
      setImportModalOpen(false);
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Import Error',
        description: getErrorMessage(error, 'Failed to import JSON configuration.'),
      });
    }
  };

  return {
    isImportModalOpen,
    setImportModalOpen,
    importedJson,
    importMode,
    setImportMode,
    fileError,
    fileName,
    handleExport,
    handleFileChange,
    handleApplyImport,
  };
}
