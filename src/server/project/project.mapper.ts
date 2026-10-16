import { Account } from '@/src/client/domain/account/entity/account';
import { Project } from '@/src/client/domain/project/entity/project';
import { toAccountDomain } from '@/src/server/account/account.mapper';
import { RawPicRelationItem } from '@/src/server/api/api.mapper';

export function toProjectDomain(p: {
  id: string;
  name: string;
  description: string | null;
  pics?: RawPicRelationItem[];
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Project {
  const pics = (p.pics || [])
    .map((item) => {
      const rawAcc = item.account || item;
      return rawAcc && typeof rawAcc === 'object' && 'id' in rawAcc && rawAcc.id
        ? toAccountDomain(rawAcc as Parameters<typeof toAccountDomain>[0])
        : null;
    })
    .filter((acc): acc is Account => Boolean(acc));

  const picIds = (p.pics || [])
    .map((item) => item.accountId || item.account?.id || item.id)
    .filter((id): id is string => Boolean(id));

  return {
    id: p.id,
    name: p.name ?? '',
    description: p.description ?? undefined,
    picIds,
    pics,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
  };
}

