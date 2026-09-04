import { z } from 'zod';
import { fail, ok, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { generateId } from '@/src/core/utils/uuid';
import { logChange } from '@/src/core/db/change_log_helper';
import { clearInternalProxyCache } from '@/src/modules/mock-proxy/mock-proxy.cache';
import { createApi, getAllApis, getApiById, getApiEnvironment, getApiEnvironmentsByApiId, getApisByProjectId, softDeleteApi, updateApi, upsertApiEnvironment } from './index';

const ObjectSchema = z.record(z.string(), z.unknown());
const IdParamsSchema = z.object({ id: z.string().trim().min(1) });
const ApiEnvironmentParamsSchema = z.object({
  apiId: z.string().trim().min(1),
  environmentId: z.string().trim().min(1),
});

export async function GET(_request: Request, context?: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    if (!context) return ok(await getAllApis());
    const { id } = IdParamsSchema.parse(await context.params);
    return ok(await getApiById(id));
  } catch (error) {
    return jsonUnknownError('API request failed', error, 'API request failed', 'API_REQUEST_FAILED');
  }
}

export async function listApisByProjectRoute(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
    return ok(await getApisByProjectId(id));
  } catch (error) {
    return jsonUnknownError('API list failed', error, 'API list failed', 'API_LIST_FAILED');
  }
}

export async function POST(request: Request) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const now = new Date().toISOString();
    const id = generateId();
    const api = await createApi({ ...input, id, createdAt: now, updatedAt: now } as never);
    await logChange({
      action: 'CREATE',
      entityType: 'api',
      entityId: id,
      projectId: api.projectId,
      afterState: api,
      description: `Created API '${api.name}' (${api.methodRequest} ${api.path})`,
    });
    clearInternalProxyCache();
    return ok(api);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid API request', 400, 'INVALID_API_REQUEST');
    return jsonUnknownError('API create failed', error, 'API create failed', 'API_CREATE_FAILED');
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const { id } = IdParamsSchema.parse(await context.params);
    const before = await getApiById(id);
    const api = await updateApi(id, input);
    await logChange({
      action: 'UPDATE',
      entityType: 'api',
      entityId: id,
      projectId: api.projectId,
      beforeState: before,
      afterState: api,
      description: `Updated API '${api.name}' (${api.methodRequest} ${api.path})`,
    });
    clearInternalProxyCache();
    return ok(api);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid API request', 400, 'INVALID_API_REQUEST');
    return jsonUnknownError('API update failed', error, 'API update failed', 'API_UPDATE_FAILED');
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
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
    clearInternalProxyCache();
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('API delete failed', error, 'API delete failed', 'API_DELETE_FAILED');
  }
}

export async function listApiEnvironmentsRoute(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
    return ok(await getApiEnvironmentsByApiId(id));
  } catch (error) {
    return jsonUnknownError('API environment list failed', error, 'API environment list failed', 'API_ENVIRONMENT_LIST_FAILED');
  }
}

export async function getApiEnvironmentRoute(_request: Request, context: { params: Promise<{ apiId: string; environmentId: string }> | { apiId: string; environmentId: string } }) {
  try {
    const { apiId, environmentId } = ApiEnvironmentParamsSchema.parse(await context.params);
    return ok(await getApiEnvironment(apiId, environmentId));
  } catch (error) {
    return jsonUnknownError('API environment request failed', error, 'API environment request failed', 'API_ENVIRONMENT_REQUEST_FAILED');
  }
}

export async function upsertApiEnvironmentRoute(request: Request) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const before = await getApiEnvironment(input.apiId as string, input.environmentId as string);
    const apiEnvironment = await upsertApiEnvironment(input as never);
    const api = await getApiById(apiEnvironment.apiId);
    await logChange({
      action: before ? 'UPDATE' : 'CREATE',
      entityType: 'api',
      entityId: apiEnvironment.apiId,
      projectId: api?.projectId,
      beforeState: before,
      afterState: apiEnvironment,
      metadata: { apiEnvironment: true, environmentId: apiEnvironment.environmentId },
      description: `${before ? 'Updated' : 'Created'} API environment override for '${api?.name || apiEnvironment.apiId}'`,
    });
    clearInternalProxyCache();
    return ok(apiEnvironment);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid API environment request', 400, 'INVALID_API_ENVIRONMENT_REQUEST');
    return jsonUnknownError('API environment upsert failed', error, 'API environment upsert failed', 'API_ENVIRONMENT_UPSERT_FAILED');
  }
}
