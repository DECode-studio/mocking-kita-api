import { Account } from '@/src/client/domain/account/entity/account';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { ApiEnvironment } from '@/src/client/domain/api/entity/api_environment';
import { MethodRequest } from '@/src/core/utils/types';
import { toAccountDomain } from '@/src/server/account/account.mapper';

export interface RawPicRelationItem {
  id?: string;
  accountId?: string;
  account?: Parameters<typeof toAccountDomain>[0] | null;
}

export function toApiDomain(api: {
  id: string;
  projectId: string;
  collectionId: string | null;
  name: string;
  description: string | null;
  path: string;
  methodRequest: string;
  pics?: RawPicRelationItem[];
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): ApiCollection {
  const pics = (api.pics || [])
    .map((item) => {
      const rawAcc = item.account || item;
      return rawAcc && typeof rawAcc === 'object' && 'id' in rawAcc && rawAcc.id
        ? toAccountDomain(rawAcc as Parameters<typeof toAccountDomain>[0])
        : null;
    })
    .filter((acc): acc is Account => Boolean(acc));

  const picIds = (api.pics || [])
    .map((item) => item.accountId || item.account?.id || item.id)
    .filter((id): id is string => Boolean(id));

  return {
    id: api.id,
    projectId: api.projectId,
    collectionId: api.collectionId ?? undefined,
    name: api.name,
    description: api.description ?? undefined,
    path: api.path,
    methodRequest: api.methodRequest as MethodRequest,
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
