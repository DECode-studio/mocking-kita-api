import { z } from 'zod';
import { fail, ok, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { generateId } from '@/src/core/utils/uuid';
import { logChange } from '@/src/core/db/change_log_helper';
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
    const id = generateId();
    const environment = await createEnvironment({ ...input, id, createdAt: now, updatedAt: now } as never);
    await logChange({
      action: 'CREATE',
      entityType: 'environment',
      entityId: id,
      projectId: environment.projectId,
      afterState: environment,
      description: `Created environment '${environment.name}'`,
    });
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
    const before = await getEnvironmentById(id);
    const environment = await updateEnvironment(id, input);
    await logChange({
      action: 'UPDATE',
      entityType: 'environment',
      entityId: id,
      projectId: environment.projectId,
      beforeState: before,
      afterState: environment,
      description: `Updated environment '${environment.name}'`,
    });
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
    const before = await getEnvironmentById(id);
    await softDeleteEnvironment(id);
    const after = await getEnvironmentById(id);
    await logChange({
      action: 'DELETE',
      entityType: 'environment',
      entityId: id,
      projectId: before?.projectId,
      beforeState: before,
      afterState: after,
      description: `Soft-deleted environment '${before?.name || id}'`,
    });
    clearInternalProxyCache();
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Environment delete failed', error, 'Environment delete failed', 'ENVIRONMENT_DELETE_FAILED');
  }
}
