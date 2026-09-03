import { Collection } from '@/src/domain/collection/entity/collection';

export function toCollectionDomain(c: {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Collection {
  return {
    id: c.id,
    projectId: c.projectId,
    name: c.name,
    description: c.description ?? undefined,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
  };
}
