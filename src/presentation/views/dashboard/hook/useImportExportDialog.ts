'use client';

import { useState, type ChangeEvent } from 'react';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { getErrorMessage } from '@/src/core/utils/error';

export function useImportExportDialog() {
  const { isImportModalOpen, setImportModalOpen, addToast } = useUIStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleExport = async () => {
    try {
      const link = document.createElement('a');
      link.href = '/api/database/export';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
    if (!file) {
      setSelectedFile(null);
      setFileName('');
      setFileError(null);
      return;
    }

    if (!file.name.endsWith('.json')) {
      setFileError('Invalid file type. Please upload a .json file.');
      setSelectedFile(null);
      setFileName('');
      return;
    }

    setFileName(file.name);
    setFileError(null);
    setSelectedFile(file);
  };

  const handleApplyImport = async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('mode', importMode);

      const response = await fetch('/api/database/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to import database');
      }

      addToast({
        type: 'success',
        title: 'Import Successful',
        description: `Successfully ${importMode === 'replace' ? 'replaced' : 'merged'} database configurations.`,
      });
      setSelectedFile(null);
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
    selectedFile,
    importMode,
    setImportMode,
    fileError,
    fileName,
    handleExport,
    handleFileChange,
    handleApplyImport,
  };
}
