import { apiRequest } from '@/src/core/http-client/api-client';

export type DatabaseAction =
  | 'getDatabase'
  | 'create'
  | 'update'
  | 'toggleStatus'
  | 'duplicate'
  | 'softDelete'
  | 'restore'
  | 'hardDelete'
  | 'createEnvironment'
  | 'updateEnvironment'
  | 'toggleEnvironmentStatus'
  | 'softDeleteEnvironment'
  | 'createApi'
  | 'updateApi'
  | 'toggleApiStatus'
  | 'duplicateApi'
  | 'softDeleteApi'
  | 'createCollection'
  | 'updateCollection'
  | 'softDeleteCollection'
  | 'upsertApiEnv'
  | 'createReqScenario'
  | 'updateReqScenario'
  | 'toggleReqStatus'
  | 'duplicateReqScenario'
  | 'softDeleteReqScenario'
  | 'createRespScenario'
  | 'updateRespScenario'
  | 'toggleRespStatus'
  | 'duplicateRespScenario'
  | 'softDeleteRespScenario'
  | 'importDatabase'
  | 'resetDatabase'
  | 'saveDatabase'
  | 'exportProjectOpenApi'
  | 'importProjectOpenApi';

export async function callDatabase<T>(action: DatabaseAction, payload?: unknown): Promise<T> {
  const response = await apiRequest<{ success: boolean; data?: T; error?: string }>('/api/database', {
    method: 'POST',
    body: { action, payload },
  });

  if (!response.success) {
    throw new Error(response.error || 'Database operation failed');
  }

  return response.data as T;
}
