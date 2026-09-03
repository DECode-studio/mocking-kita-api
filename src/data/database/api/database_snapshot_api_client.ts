import { apiRequest } from '@/src/core/http-client/api-client';
import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/data/common/remote-response';

export async function getDatabaseSnapshot(): Promise<MockApiDatabase> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<MockApiDatabase>>('/api/database'));
}

export async function importDatabaseSnapshot(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<MockApiDatabase>>('/api/database', {
    method: 'POST',
    body: { action: 'importDatabase', payload: { data, mode } },
  }));
}

export async function resetDatabaseSnapshot(): Promise<void> {
  unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>('/api/database', {
    method: 'POST',
    body: { action: 'resetDatabase' },
  }));
}
