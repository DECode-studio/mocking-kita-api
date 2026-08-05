'use client';

import { useMemo } from 'react';
import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { Environment } from '@/src/domain/environment/entity/environment';

type EnvironmentOverrideDeps = {
  apiId: string;
  apiPath: string;
  projectEnvs: Environment[];
  apiEnvironments: ApiEnvironment[];
  upsertApiEnvironment: (input: {
    apiId: string;
    environmentId: string;
    enabled: boolean;
    pathOverride?: string;
  }) => Promise<void>;
};

export function useEnvironmentOverrideActions({
  apiId,
  apiPath,
  projectEnvs,
  apiEnvironments,
  upsertApiEnvironment,
}: EnvironmentOverrideDeps) {
  const environmentRows = useMemo(
    () =>
      projectEnvs.map((env) => {
        const apiEnv = apiEnvironments.find((ae) => ae.apiId === apiId && ae.environmentId === env.id);
        const isEnabled = apiEnv ? apiEnv.enabled : true;
        const pathOverride = apiEnv?.pathOverride || '';
        const resolvedPath = pathOverride || apiPath;
        const resolvedUrl = env.publicBaseUrl + resolvedPath;

        return {
          env,
          apiEnv,
          isEnabled,
          pathOverride,
          resolvedPath,
          resolvedUrl,
        };
      }),
    [apiEnvironments, apiId, apiPath, projectEnvs]
  );

  const handleToggleEnabled = async (environmentId: string, enabled: boolean, pathOverride: string) => {
    await upsertApiEnvironment({
      apiId,
      environmentId,
      enabled,
      pathOverride,
    });
  };

  const handleUpdatePathOverride = async (environmentId: string, enabled: boolean, value: string) => {
    await upsertApiEnvironment({
      apiId,
      environmentId,
      enabled,
      pathOverride: value.trim() || undefined,
    });
  };

  return {
    environmentRows,
    handleToggleEnabled,
    handleUpdatePathOverride,
  };
}
