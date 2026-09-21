import { z } from 'zod';
import { fail, ok, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { generateId } from '@/src/core/utils/uuid';
import { logChange } from '@/src/core/db/change_log_helper';
import { clearInternalProxyCache } from '@/src/server/mock-proxy/mock-proxy.cache';
import {
  createEnvironment,
  getAllEnvironments,
  getEnvironmentById,
  getEnvironmentsByProjectId,
  softDeleteEnvironment,
  updateEnvironment,
} from './environment.repository';

const IdParamsSchema = z.object({ id: z.string().trim().min(1) });

const EnvironmentCreateSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z.string().trim().min(1, 'Environment name is required'),
  isBaseUrl: z.boolean().optional().default(true),
  values: z.record(z.string(), z.unknown()).optional(),
  environmentType: z.string().optional(),
  variables: z.unknown().optional(),
  baseUrl: z.string().optional(),
  status: z.boolean().optional().default(true),
});

const EnvironmentUpdateSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().trim().min(1).optional(),
  isBaseUrl: z.boolean().optional(),
  values: z.record(z.string(), z.unknown()).optional(),
  environmentType: z.string().optional(),
  variables: z.unknown().optional(),
  baseUrl: z.string().optional(),
  status: z.boolean().optional(),
});

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
    const raw = await request.json();
    const input = EnvironmentCreateSchema.parse(raw);
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
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || 'Invalid environment request', 400, 'INVALID_ENVIRONMENT_REQUEST');
    }
    if (error instanceof SyntaxError) {
      return fail('Invalid JSON payload', 400, 'INVALID_ENVIRONMENT_REQUEST');
    }
    return jsonUnknownError('Environment create failed', error, 'Environment create failed', 'ENVIRONMENT_CREATE_FAILED');
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const raw = await request.json();
    const input = EnvironmentUpdateSchema.parse(raw);
    const { id } = IdParamsSchema.parse(await context.params);
    const before = await getEnvironmentById(id);
    const environment = await updateEnvironment(id, input as any);
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
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || 'Invalid environment request', 400, 'INVALID_ENVIRONMENT_REQUEST');
    }
    if (error instanceof SyntaxError) {
      return fail('Invalid JSON payload', 400, 'INVALID_ENVIRONMENT_REQUEST');
    }
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
