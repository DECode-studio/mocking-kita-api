import { apiRequest } from '@/src/core/http-client/api-client';
import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';
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
}

// Standalone functions for backward compatibility / tests if needed
export const getDatabaseSnapshot = () => new DatabaseSnapshotRemoteDataSourceImpl().getDatabaseSnapshot();
export const importDatabaseSnapshot = (data: MockApiDatabase, mode: 'replace' | 'merge') => new DatabaseSnapshotRemoteDataSourceImpl().importDatabaseSnapshot(data, mode);
export const resetDatabaseSnapshot = () => new DatabaseSnapshotRemoteDataSourceImpl().resetDatabaseSnapshot();
