import { Project } from '@/src/domain/project/entity/project';
import { toAccountDomain } from '@/src/modules/account/account.mapper';

export function toProjectDomain(p: {
  id: string;
  name: string;
  description: string | null;
  pics?: any[];
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Project {
  const pics = (p.pics || [])
    .map((item) => {
      const rawAcc = item.account || item;
      return rawAcc?.id ? toAccountDomain(rawAcc) : null;
    })
    .filter(Boolean) as any[];

  const picIds = (p.pics || [])
    .map((item) => item.accountId || item.account?.id || item.id)
    .filter(Boolean);

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

