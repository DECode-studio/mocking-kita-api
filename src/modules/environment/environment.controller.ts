import { z } from 'zod';
import { fail, ok, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { generateId } from '@/src/core/utils/uuid';
import { clearInternalProxyCache } from '@/src/modules/mock-proxy/mock-proxy.cache';
import { createEnvironment, getAllEnvironments, getEnvironmentById, getEnvironmentsByProjectId, softDeleteEnvironment, updateEnvironment } from './environment.repository';

const ObjectSchema = z.record(z.string(), z.unknown());
const IdParamsSchema = z.object({ id: z.string().trim().min(1) });

export async function GET(_request: Request, context?: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    if (!context) return ok(await getAllEnvironments());
    const { id } = IdParamsSchema.parse(await context.params);
    return ok(await getEnvironmentById(id));
  } catch (error) {
    return jsonUnknownError('Environment request failed', error, 'Environment request failed', 'ENVIRONMENT_REQUEST_FAILED');
  }
}

export async function listEnvironmentsByProjectRoute(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
    return ok(await getEnvironmentsByProjectId(id));
  } catch (error) {
    return jsonUnknownError('Environment list failed', error, 'Environment list failed', 'ENVIRONMENT_LIST_FAILED');
  }
}

export async function POST(request: Request) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const now = new Date().toISOString();
    const environment = await createEnvironment({ ...input, id: generateId(), createdAt: now, updatedAt: now } as never);
    clearInternalProxyCache();
    return ok(environment);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid environment request', 400, 'INVALID_ENVIRONMENT_REQUEST');
    return jsonUnknownError('Environment create failed', error, 'Environment create failed', 'ENVIRONMENT_CREATE_FAILED');
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const { id } = IdParamsSchema.parse(await context.params);
    const environment = await updateEnvironment(id, input);
    clearInternalProxyCache();
    return ok(environment);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid environment request', 400, 'INVALID_ENVIRONMENT_REQUEST');
    return jsonUnknownError('Environment update failed', error, 'Environment update failed', 'ENVIRONMENT_UPDATE_FAILED');
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
    await softDeleteEnvironment(id);
    clearInternalProxyCache();
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Environment delete failed', error, 'Environment delete failed', 'ENVIRONMENT_DELETE_FAILED');
  }
}
