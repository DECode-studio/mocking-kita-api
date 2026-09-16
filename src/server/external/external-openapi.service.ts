import prisma from '@/src/core/db/prisma-client';
import { importProjectOpenApi } from '@/src/core/db/openapi_storage_helper';
import { clearInternalProxyCache } from '@/src/server/mock-proxy/mock-proxy.cache';

export interface UpsertOpenApiInput {
  projectId: string;
  mode?: 'upsert' | 'merge' | 'replace';
  openApiJson: any;
}

export async function upsertExternalOpenApi(input: UpsertOpenApiInput) {
  if (!input.projectId || !input.openApiJson) {
    return {
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
      message: "Fields 'projectId' and 'openApiJson' are required",
    };
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
  });

  if (!project) {
    return {
      success: false,
      status: 404,
      code: 'NOT_FOUND',
      message: `Project with ID '${input.projectId}' not found`,
    };
  }

  const mode = input.mode || 'upsert';

  try {
    const result = await importProjectOpenApi(input.projectId, input.openApiJson, mode);
    clearInternalProxyCache();

    return {
      success: true,
      status: 200,
      message: 'OpenAPI specification imported/upserted successfully',
      data: {
        projectId: input.projectId,
        mode,
        importedApis: result.importedApiCount ?? 0,
        importedCollections: result.importedCollectionCount ?? 0,
        updatedApis: result.updatedApiCount ?? 0,
        details: result,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      status: 400,
      code: 'OPENAPI_IMPORT_FAILED',
      message: error?.message || 'Failed to import OpenAPI specification',
    };
  }
}
