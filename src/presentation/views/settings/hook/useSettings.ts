'use client';

import { useState, type ChangeEvent } from 'react';
import { useThemeStore } from '@/src/core/theme/themeStore';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { useAuthStore } from '@/src/presentation/stores/authStore';
import { usePageLoadingOverlay } from '@/src/presentation/components/shared/PageLoadingOverlay';
import { canResetDatabase, canBackupRestoreDatabase } from '@/src/core/constants/roles';
import { DatabaseResetUseCase } from '@/src/domain/database/usecase/database_reset_usecase';
import { getErrorMessage } from '@/src/core/utils/error';
import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';

export interface FileSummary {
  format: 'sql' | 'json';
  projects?: number;
  apis?: number;
  scenarios?: number;
  statementsCount?: number;
  lineCount?: number;
}

export function useSettings(databaseResetUseCase: DatabaseResetUseCase) {
  const { theme, setTheme } = useThemeStore();
  const { setImportModalOpen, addToast } = useUIStore();
  const { session } = useAuthStore();
  const pageLoading = usePageLoadingOverlay();

  // Reset state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Backup Download State
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'sql' | 'json'>('sql');

  // Backup Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [fileSummary, setFileSummary] = useState<FileSummary | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [isImporting, setIsImporting] = useState(false);

  const canResetDb = canResetDatabase(session?.role);
  const canBackupRestoreDb = canBackupRestoreDatabase(session?.role);


  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFile = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const isSql = lowerName.endsWith('.sql');
    const isJson = lowerName.endsWith('.json');

    if (!isSql && !isJson) {
      setFileError('Invalid file type. Please upload a .sql or .json database backup file.');
      setSelectedFile(null);
      setFileName('');
      setFileSize(null);
      setFileSummary(null);
      return;
    }

    try {
      const text = await file.text();

      if (isSql) {
        if (!text || text.trim().length === 0) {
          throw new Error('The uploaded .sql file is empty.');
        }

        const lines = text.split('\n').filter((l) => l.trim().length > 0 && !l.trim().startsWith('--'));
        const approxStatements = (text.match(/;/g) || []).length;

        setFileName(file.name);
        setFileSize(formatFileSize(file.size));
        setFileError(null);
        setSelectedFile(file);
        setFileSummary({
          format: 'sql',
          statementsCount: approxStatements > 0 ? approxStatements : lines.length,
          lineCount: text.split('\n').length,
        });
        return;
      }

      if (isJson) {
        const parsed = JSON.parse(text) as unknown;

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('File does not contain a valid JSON object.');
        }

        const db = parsed as Partial<MockApiDatabase>;
        const projectCount = Array.isArray(db.projects) ? db.projects.length : 0;
        const apiCount = Array.isArray(db.apiCollections) ? db.apiCollections.length : 0;
        const scenarioCount =
          (Array.isArray(db.requestScenarios) ? db.requestScenarios.length : 0) +
          (Array.isArray(db.responseScenarios) ? db.responseScenarios.length : 0);

        setFileName(file.name);
        setFileSize(formatFileSize(file.size));
        setFileError(null);
        setSelectedFile(file);
        setFileSummary({
          format: 'json',
          projects: projectCount,
          apis: apiCount,
          scenarios: scenarioCount,
        });
      }
    } catch (err) {
      setFileError(getErrorMessage(err, 'Failed to parse file. Ensure it is a valid backup file.'));
      setSelectedFile(null);
      setFileName('');
      setFileSize(null);
      setFileSummary(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      handleClearFile();
      return;
    }
    processFile(file);
  };

  const handleFileDrop = (file: File) => {
    processFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileName('');
    setFileSize(null);
    setFileSummary(null);
    setFileError(null);
  };

  const handleDownloadBackup = async (format: 'sql' | 'json' = 'sql') => {
    if (!canBackupRestoreDb) {
      addToast({
        type: 'error',
        title: 'Permission Denied',
        description: 'Only Admin and Manager roles are allowed to backup the database.',
      });
      return;
    }

    setIsDownloading(true);
    setDownloadFormat(format);
    await pageLoading.run(
      {
        title: `Mengunduh backup ${format.toUpperCase()}`,
        description: 'Data project, endpoint, environment, dan skenario sedang disiapkan.',
      },
      async () => {
        try {
          const response = await fetch(`/api/database/export?format=${format}`);
          if (!response.ok) {
            throw new Error(`Failed to export database (${response.status}: ${response.statusText})`);
          }

          const blob = await response.blob();
          const disposition = response.headers.get('Content-Disposition');
          let downloadName = `mock-api-studio-backup-${new Date().toISOString().slice(0, 10)}.${format}`;

          if (disposition && disposition.includes('filename=')) {
            const match = disposition.match(/filename="?([^"]+)"?/);
            if (match && match[1]) {
              downloadName = match[1];
            }
          }

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          addToast({
            type: 'success',
            title: 'Database Backup Downloaded',
            description: `Exported ${format.toUpperCase()} backup file saved as ${downloadName}.`,
          });
        } catch (error: unknown) {
          addToast({
            type: 'error',
            title: 'Download Backup Failed',
            description: getErrorMessage(error, 'Could not export database.'),
          });
        } finally {
          setIsDownloading(false);
        }
      }
    );
  };

  const handleApplyImport = async () => {
    if (!selectedFile) return;
    if (!canBackupRestoreDb) {
      addToast({
        type: 'error',
        title: 'Permission Denied',
        description: 'Only Admin and Manager roles are allowed to restore the database.',
      });
      return;
    }

    setIsImporting(true);
    await pageLoading.run(
      {
        title: importMode === 'replace' ? 'Mengganti data dari backup' : 'Menggabungkan data dari backup',
        description: importMode === 'replace'
          ? 'Data lama akan diganti dengan isi file backup yang dipilih.'
          : 'Isi backup sedang ditambahkan tanpa menghapus data yang ada.',
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

          const data = (await response.json()) as {
            success: boolean;
            data?: { message?: string; statementsExecuted?: number; chunksExecuted?: number };
            error?: string;
          };
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to import database');
          }

          addToast({
            type: 'success',
            title: 'Database Import Successful',
            description: data.data?.message || `Successfully restored mock database configurations from ${selectedFile.name}.`,
          });

          handleClearFile();
          setIsImportModalOpen(false);
        } catch (error: unknown) {
          addToast({
            type: 'error',
            title: 'Import Database Failed',
            description: getErrorMessage(error, 'Failed to import backup configuration.'),
          });
        } finally {
          setIsImporting(false);
        }
      }
    );
  };

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

    setIsResetting(true);
    await pageLoading.run(
      {
        title: 'Mengosongkan database',
        description: 'Semua project, endpoint, environment, dan skenario sedang dihapus permanen.',
      },
      async () => {
        try {
          await databaseResetUseCase.resetDatabase();
          addToast({
            type: 'warning',
            title: 'Database Wiped',
            description: 'Permanently wiped all database records. Database is now completely empty.',
          });
        } catch (error: unknown) {
          addToast({
            type: 'error',
            title: 'Database Wipe Failed',
            description: getErrorMessage(error, 'Failed to wipe database.'),
          });
        } finally {
          setIsResetting(false);
          setIsResetConfirmOpen(false);
        }
      }
    );
  };

  return {
    theme,
    setTheme,
    setImportModalOpen,
    addToast,
    // Reset DB
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
    importFileFormat: fileSummary?.format ?? null,
    fileError,
    importMode,
    setImportMode,
    isImporting,
    handleFileChange,
    handleFileDrop,
    handleClearFile,
    handleApplyImport,
  };
}
