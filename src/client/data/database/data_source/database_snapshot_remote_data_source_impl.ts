import { apiRequest } from '@/src/core/http-client/api-client';
import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';
import { DatabaseImportResult } from '@/src/client/domain/database/repository/database_snapshot_repository';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { DatabaseSnapshotRemoteDataSource } from './database_snapshot_data_source';

export class DatabaseSnapshotRemoteDataSourceImpl implements DatabaseSnapshotRemoteDataSource {
  async getDatabaseSnapshot(): Promise<MockApiDatabase> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<MockApiDatabase>>('/api/database'));
  }

  async importDatabaseSnapshot(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<MockApiDatabase>>('/api/database', {
      method: 'POST',
      body: { action: 'importDatabase', payload: { data, mode } },
    }));
  }

  async resetDatabaseSnapshot(): Promise<void> {
    unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>('/api/database', {
      method: 'POST',
      body: { action: 'resetDatabase' },
    }));
  }

  async exportDatabase(format: 'json' | 'sql'): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(`/api/database/export?format=${format}`);
    if (!response.ok) {
      throw new Error(`Failed to export database (${response.status}: ${response.statusText})`);
    }
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    let filename = `mock-api-studio-backup-${new Date().toISOString().slice(0, 10)}.${format}`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }
    return { blob, filename };
  }

  async importDatabaseFile(file: File, mode: 'replace' | 'merge'): Promise<DatabaseImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    const response = await fetch('/api/database/import', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = (await response.json()) as {
      success: boolean;
      data?: DatabaseImportResult;
      error?: string;
    };

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to import database file');
    }

    return data.data || {};
  }
}

// Standalone functions for backward compatibility / tests if needed
export const getDatabaseSnapshot = () => new DatabaseSnapshotRemoteDataSourceImpl().getDatabaseSnapshot();
export const importDatabaseSnapshot = (data: MockApiDatabase, mode: 'replace' | 'merge') => new DatabaseSnapshotRemoteDataSourceImpl().importDatabaseSnapshot(data, mode);
export const resetDatabaseSnapshot = () => new DatabaseSnapshotRemoteDataSourceImpl().resetDatabaseSnapshot();

