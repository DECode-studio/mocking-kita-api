import { Project } from '@/src/domain/project/entity/project';

export function toProjectDomain(p: {
  id: string;
  name: string;
  description: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Project {
  return {
    id: p.id,
    name: p.name ?? '',
    description: p.description ?? undefined,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
  };
}
