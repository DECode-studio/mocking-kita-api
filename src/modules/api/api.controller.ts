import { z } from 'zod';
import { fail, ok, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { generateId } from '@/src/core/utils/uuid';
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
    const api = await createApi({ ...input, id: generateId(), createdAt: now, updatedAt: now } as never);
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
    const api = await updateApi(id, input);
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
    await softDeleteApi(id);
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
    const apiEnvironment = await upsertApiEnvironment(input as never);
    clearInternalProxyCache();
    return ok(apiEnvironment);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid API environment request', 400, 'INVALID_API_ENVIRONMENT_REQUEST');
    return jsonUnknownError('API environment upsert failed', error, 'API environment upsert failed', 'API_ENVIRONMENT_UPSERT_FAILED');
  }
}
