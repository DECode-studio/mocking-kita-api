'use client';

import { useState, type ChangeEvent } from 'react';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { useAuthStore } from '@/src/presentation/stores/authStore';
import { usePageLoadingOverlay } from '@/src/presentation/components/shared/PageLoadingOverlay';
import { canBackupRestoreDatabase } from '@/src/core/constants/roles';
import { getErrorMessage } from '@/src/core/utils/error';

export function useImportExportDialog() {
  const { isImportModalOpen, setImportModalOpen, addToast } = useUIStore();
  const { session } = useAuthStore();
  const pageLoading = usePageLoadingOverlay();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const canBackupRestoreDb = canBackupRestoreDatabase(session?.role);

  const handleExport = async () => {
    if (!canBackupRestoreDb) {
      addToast({
        type: 'error',
        title: 'Permission Denied',
        description: 'Only Admin and Manager roles are allowed to export the database.',
      });
      return;
    }

    setIsProcessing(true);
    await pageLoading.run(
      {
        title: 'Mengunduh backup JSON',
        description: 'Konfigurasi mock API sedang disiapkan sebagai file cadangan.',
      },
      async () => {
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
        } finally {
          setIsProcessing(false);
        }
      }
    );
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
    if (!canBackupRestoreDb) {
      addToast({
        type: 'error',
        title: 'Permission Denied',
        description: 'Only Admin and Manager roles are allowed to import database backups.',
      });
      return;
    }

    setIsProcessing(true);
    await pageLoading.run(
      {
        title: importMode === 'replace' ? 'Mengganti konfigurasi dari JSON' : 'Menggabungkan konfigurasi dari JSON',
        description: importMode === 'replace'
          ? 'Data lama akan diganti dengan isi file JSON yang dipilih.'
          : 'Data dari file JSON sedang ditambahkan ke konfigurasi yang ada.',
      },
      async () => {
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
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  return {
    isImportModalOpen,
    setImportModalOpen,
    selectedFile,
    importMode,
    setImportMode,
    fileError,
    fileName,
    isProcessing,
    canBackupRestoreDb,
    handleExport,
    handleFileChange,
    handleApplyImport,
  };
}
