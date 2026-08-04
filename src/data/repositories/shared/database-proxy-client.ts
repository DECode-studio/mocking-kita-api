import { apiRequest } from '@/src/core/http-client/api-client';

export type DatabaseAction =
  | 'getDatabase'
  | 'saveDatabase'
  | 'resetDatabase'
  | 'importDatabase'
  | 'create'
  | 'update'
  | 'softDelete'
  | 'restore'
  | 'hardDelete'
  | 'createEnvironment'
  | 'updateEnvironment'
  | 'softDeleteEnvironment'
  | 'createApi'
  | 'updateApi'
  | 'softDeleteApi'
  | 'upsertApiEnv'
  | 'createReqScenario'
  | 'updateReqScenario'
  | 'softDeleteReqScenario'
  | 'createRespScenario'
  | 'updateRespScenario'
  | 'softDeleteRespScenario';

export async function callDatabase<T>(action: DatabaseAction, payload?: unknown): Promise<T> {
  return apiRequest<T>('/api/database', {
    method: 'POST',
    body: { action, payload },
  });
}
