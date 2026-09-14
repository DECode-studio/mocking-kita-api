import { Environment } from '@/src/client/domain/environment/entity/environment';

export function toEnvironmentDomain(env: {
  id: string;
  projectId: string;
  name: string;
  environmentType: string;
  publicBaseUrl: string | null;
  originBaseUrl: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Environment {
  return {
    id: env.id,
    projectId: env.projectId,
    name: env.name,
    environmentType: env.environmentType as any,
    publicBaseUrl: env.publicBaseUrl ?? undefined,
    originBaseUrl: env.originBaseUrl ?? undefined,
    status: env.status,
    createdAt: env.createdAt.toISOString(),
    updatedAt: env.updatedAt.toISOString(),
    deletedAt: env.deletedAt ? env.deletedAt.toISOString() : null,
  };
}
