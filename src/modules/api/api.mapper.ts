import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { toAccountDomain } from '@/src/modules/account/account.mapper';

export function toApiDomain(api: {
  id: string;
  projectId: string;
  collectionId: string | null;
  name: string;
  description: string | null;
  path: string;
  methodRequest: string;
  pics?: any[];
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): ApiCollection {
  const pics = (api.pics || [])
    .map((item) => {
      const rawAcc = item.account || item;
      return rawAcc?.id ? toAccountDomain(rawAcc) : null;
    })
    .filter(Boolean) as any[];

  const picIds = (api.pics || [])
    .map((item) => item.accountId || item.account?.id || item.id)
    .filter(Boolean);

  return {
    id: api.id,
    projectId: api.projectId,
    collectionId: api.collectionId ?? undefined,
    name: api.name,
    description: api.description ?? undefined,
    path: api.path,
    methodRequest: api.methodRequest as any,
    picIds,
    pics,
    status: api.status,
    createdAt: api.createdAt.toISOString(),
    updatedAt: api.updatedAt.toISOString(),
    deletedAt: api.deletedAt ? api.deletedAt.toISOString() : null,
  };
}

export function toApiEnvironmentDomain(row: {
  id: string;
  apiId: string;
  environmentId: string;
  enabled: boolean;
  pathOverride: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ApiEnvironment {
  return {
    id: row.id,
    apiId: row.apiId,
    environmentId: row.environmentId,
    enabled: row.enabled,
    pathOverride: row.pathOverride ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
