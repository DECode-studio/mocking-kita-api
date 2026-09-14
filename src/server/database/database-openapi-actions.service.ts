import prisma from '@/src/core/db/prisma-client';
import { getProjectById } from '@/src/server/project';
import { exportProjectOpenApi, importProjectOpenApi } from '@/src/core/db/openapi_storage_helper';
import { logChange } from '@/src/core/db/change_log_helper';
import { DatabaseActionContext } from './database-action-context';
import { DatabaseActionBody, ExportProjectOpenApiPayloadSchema, ImportProjectOpenApiPayloadSchema } from './database.schema';

export async function handleOpenApiDatabaseAction(body: DatabaseActionBody, context: DatabaseActionContext): Promise<Response | null> {
  switch (body.action) {
    case 'exportProjectOpenApi': {
      const payload = ExportProjectOpenApiPayloadSchema.parse(body.payload);
      return context.respond(await exportProjectOpenApi(payload.projectId));
    }
    case 'importProjectOpenApi': {
      const payload = ImportProjectOpenApiPayloadSchema.parse(body.payload);
      const project = await getProjectById(payload.projectId);
      const beforeApiCount = await prisma.api.count({ where: { projectId: payload.projectId } });
      const result = await importProjectOpenApi(payload.projectId, payload.openApiJson, payload.mode);
      const afterApiCount = await prisma.api.count({ where: { projectId: payload.projectId } });
      await logChange({
        action: 'IMPORT',
        entityType: 'project',
        entityId: payload.projectId,
        projectId: payload.projectId,
        beforeState: { apiCount: beforeApiCount },
        afterState: { apiCount: afterApiCount },
        metadata: { mode: payload.mode, openApiImport: true },
        description: `Imported OpenAPI spec into project '${project?.name || payload.projectId}' (mode: ${payload.mode})`,
      });
      return context.respond(result);
    }
    default:
      return null;
  }
}
