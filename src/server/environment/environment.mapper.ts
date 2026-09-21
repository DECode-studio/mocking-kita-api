import {
  Environment,
  EnvironmentVariable,
  normalizeEnvironmentValues,
  getEnvironmentBaseUrl,
} from '@/src/client/domain/environment/entity/environment';

export function toEnvironmentDomain(env: {
  id: string;
  projectId: string;
  name: string;
  isBaseUrl?: boolean;
  values?: any;
  environmentType?: string | null;
  variables?: any;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Environment {
  const isBaseUrl = env.isBaseUrl !== false;
  const values = normalizeEnvironmentValues(env.values, isBaseUrl);

  let parsedVariables: EnvironmentVariable[] = [];

  if (Array.isArray(env.variables)) {
    parsedVariables = env.variables as EnvironmentVariable[];
  } else if (typeof env.variables === 'string') {
    try {
      const parsed = JSON.parse(env.variables);
      if (Array.isArray(parsed)) {
        parsedVariables = parsed;
      } else if (parsed && typeof parsed === 'object') {
        parsedVariables = Object.entries(parsed).map(([k, v]) => ({
          id: k,
          key: k,
          value: String(v),
          type: 'plain',
          enabled: true,
        }));
      }
    } catch {
      parsedVariables = [];
    }
  } else if (env.variables && typeof env.variables === 'object') {
    parsedVariables = Object.entries(env.variables).map(([k, v]) => ({
      id: k,
      key: k,
      value: String(v),
      type: 'plain',
      enabled: true,
    }));
  }

  const baseUrl = getEnvironmentBaseUrl({
    values,
    isBaseUrl,
    environmentType: env.environmentType,
    variables: parsedVariables,
  });

  return {
    id: env.id,
    projectId: env.projectId,
    name: env.name,
    isBaseUrl,
    values,
    environmentType: (env.environmentType as any) || null,
    variables: parsedVariables,
    baseUrl,
    status: env.status,
    createdAt: env.createdAt.toISOString(),
    updatedAt: env.updatedAt.toISOString(),
    deletedAt: env.deletedAt ? env.deletedAt.toISOString() : null,
  };
}
