import { createApi, getApiById, getApiEnvironment, softDeleteApi, updateApi, upsertApiEnvironment } from '@/src/server/api';
import { createRequestScenario, getRequestScenarioById, softDeleteRequestScenario, updateRequestScenario } from '@/src/server/request-scenario';
import { createResponseScenario, getResponseScenarioById, softDeleteResponseScenario, updateResponseScenario } from '@/src/server/response-scenario';
import { generateId } from '@/src/core/utils/uuid';
import { logChange } from '@/src/core/db/change_log_helper';
import { DatabaseActionContext } from './database-action-context';
import { DatabaseActionBody, IdPayloadSchema, ObjectPayloadSchema, UpdatePayloadSchema } from './database.schema';

export async function handleApiDatabaseAction(body: DatabaseActionBody, context: DatabaseActionContext): Promise<Response | null> {
  switch (body.action) {
    case 'createApi': {
      const input = ObjectPayloadSchema.parse(body.payload);
      const id = generateId();
      const result = await createApi({ ...input, id, createdAt: context.now, updatedAt: context.now } as never);
      await logChange({
        action: 'CREATE',
        entityType: 'api',
        entityId: id,
        projectId: result.projectId,
        afterState: result,
        description: `Created API '${result.name}' (${result.methodRequest} ${result.path})`,
      });
      return context.respond(result);
    }
    case 'updateApi': {
      const payload = UpdatePayloadSchema.parse(body.payload);
      const before = await getApiById(payload.id);
      const result = await updateApi(payload.id, payload.input);
      await logChange({
        action: 'UPDATE',
        entityType: 'api',
        entityId: payload.id,
        projectId: result.projectId,
        beforeState: before,
        afterState: result,
        description: `Updated API '${result.name}' (${result.methodRequest} ${result.path})`,
      });
      return context.respond(result);
    }
    case 'softDeleteApi': {
      const { id } = IdPayloadSchema.parse(body.payload);
      const before = await getApiById(id);
      await softDeleteApi(id);
      const after = await getApiById(id);
      await logChange({
        action: 'DELETE',
        entityType: 'api',
        entityId: id,
        projectId: before?.projectId,
        beforeState: before,
        afterState: after,
        description: `Soft-deleted API '${before?.name || id}'`,
      });
      return context.respondVoid();
    }
    case 'upsertApiEnv':
      {
        const input = ObjectPayloadSchema.parse(body.payload);
        const before = await getApiEnvironment(input.apiId as string, input.environmentId as string);
        const result = await upsertApiEnvironment(input as never);
        const api = await getApiById(result.apiId);
        await logChange({
          action: before ? 'UPDATE' : 'CREATE',
          entityType: 'api',
          entityId: result.apiId,
          projectId: api?.projectId,
          beforeState: before,
          afterState: result,
          metadata: { apiEnvironment: true, environmentId: result.environmentId },
          description: `${before ? 'Updated' : 'Created'} API environment override for '${api?.name || result.apiId}'`,
        });
        return context.respond(result);
      }
    default:
      return null;
  }
}

export async function handleRequestScenarioDatabaseAction(body: DatabaseActionBody, context: DatabaseActionContext): Promise<Response | null> {
  switch (body.action) {
    case 'createReqScenario': {
      const input = ObjectPayloadSchema.parse(body.payload);
      const id = generateId();
      const result = await createRequestScenario({ ...input, id, createdAt: context.now, updatedAt: context.now } as never);
      const api = await getApiById(result.apiId);
      await logChange({
        action: 'CREATE',
        entityType: 'request_scenario',
        entityId: id,
        projectId: api?.projectId,
        afterState: result,
        description: `Created request scenario '${result.name}'`,
      });
      return context.respond(result);
    }
    case 'updateReqScenario': {
      const payload = UpdatePayloadSchema.parse(body.payload);
      const before = await getRequestScenarioById(payload.id);
      const result = await updateRequestScenario(payload.id, payload.input);
      const api = await getApiById(result.apiId);
      await logChange({
        action: 'UPDATE',
        entityType: 'request_scenario',
        entityId: payload.id,
        projectId: api?.projectId,
        beforeState: before,
        afterState: result,
        description: `Updated request scenario '${result.name}'`,
      });
      return context.respond(result);
    }
    case 'softDeleteReqScenario': {
      const { id } = IdPayloadSchema.parse(body.payload);
      const before = await getRequestScenarioById(id);
      await softDeleteRequestScenario(id);
      const after = await getRequestScenarioById(id);
      const api = before ? await getApiById(before.apiId) : null;
      await logChange({
        action: 'DELETE',
        entityType: 'request_scenario',
        entityId: id,
        projectId: api?.projectId,
        beforeState: before,
        afterState: after,
        description: `Soft-deleted request scenario '${before?.name || id}'`,
      });
      return context.respondVoid();
    }
    default:
      return null;
  }
}

export async function handleResponseScenarioDatabaseAction(body: DatabaseActionBody, context: DatabaseActionContext): Promise<Response | null> {
  switch (body.action) {
    case 'createRespScenario': {
      const input = ObjectPayloadSchema.parse(body.payload);
      const id = generateId();
      const result = await createResponseScenario({ ...input, id, createdAt: context.now, updatedAt: context.now } as never);
      const requestScenario = await getRequestScenarioById(result.requestScenarioId);
      const api = requestScenario ? await getApiById(requestScenario.apiId) : null;
      await logChange({
        action: 'CREATE',
        entityType: 'response_scenario',
        entityId: id,
        projectId: api?.projectId,
        afterState: result,
        description: `Created response scenario '${result.name}' (HTTP ${result.statusCode})`,
      });
      return context.respond(result);
    }
    case 'updateRespScenario': {
      const payload = UpdatePayloadSchema.parse(body.payload);
      const before = await getResponseScenarioById(payload.id);
      const result = await updateResponseScenario(payload.id, payload.input);
      const requestScenario = await getRequestScenarioById(result.requestScenarioId);
      const api = requestScenario ? await getApiById(requestScenario.apiId) : null;
      await logChange({
        action: 'UPDATE',
        entityType: 'response_scenario',
        entityId: payload.id,
        projectId: api?.projectId,
        beforeState: before,
        afterState: result,
        description: `Updated response scenario '${result.name}' (HTTP ${result.statusCode})`,
      });
      return context.respond(result);
    }
    case 'softDeleteRespScenario': {
      const { id } = IdPayloadSchema.parse(body.payload);
      const before = await getResponseScenarioById(id);
      await softDeleteResponseScenario(id);
      const after = await getResponseScenarioById(id);
      const requestScenario = before ? await getRequestScenarioById(before.requestScenarioId) : null;
      const api = requestScenario ? await getApiById(requestScenario.apiId) : null;
      await logChange({
        action: 'DELETE',
        entityType: 'response_scenario',
        entityId: id,
        projectId: api?.projectId,
        beforeState: before,
        afterState: after,
        description: `Soft-deleted response scenario '${before?.name || id}'`,
      });
      return context.respondVoid();
    }
    default:
      return null;
  }
}
