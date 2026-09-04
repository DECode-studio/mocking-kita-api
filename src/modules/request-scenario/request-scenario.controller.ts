import { z } from 'zod';
import { fail, ok, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { generateId } from '@/src/core/utils/uuid';
import { logChange } from '@/src/core/db/change_log_helper';
import { getApiById } from '@/src/modules/api';
import { clearInternalProxyCache } from '@/src/modules/mock-proxy/mock-proxy.cache';
import { createRequestScenario, getRequestScenarioById, getRequestScenariosByApiId, softDeleteRequestScenario, updateRequestScenario } from './request-scenario.repository';

const ObjectSchema = z.record(z.string(), z.unknown());
const IdParamsSchema = z.object({ id: z.string().trim().min(1) });

export async function listRequestScenariosByApiRoute(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
    return ok(await getRequestScenariosByApiId(id));
  } catch (error) {
    return jsonUnknownError('Request scenario list failed', error, 'Request scenario list failed', 'REQUEST_SCENARIO_LIST_FAILED');
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
    return ok(await getRequestScenarioById(id));
  } catch (error) {
    return jsonUnknownError('Request scenario request failed', error, 'Request scenario request failed', 'REQUEST_SCENARIO_REQUEST_FAILED');
  }
}

export async function POST(request: Request) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const now = new Date().toISOString();
    const id = generateId();
    const scenario = await createRequestScenario({ ...input, id, createdAt: now, updatedAt: now } as never);
    const api = await getApiById(scenario.apiId);
    await logChange({
      action: 'CREATE',
      entityType: 'request_scenario',
      entityId: id,
      projectId: api?.projectId,
      afterState: scenario,
      description: `Created request scenario '${scenario.name}'`,
    });
    clearInternalProxyCache();
    return ok(scenario);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid request scenario request', 400, 'INVALID_REQUEST_SCENARIO_REQUEST');
    return jsonUnknownError('Request scenario create failed', error, 'Request scenario create failed', 'REQUEST_SCENARIO_CREATE_FAILED');
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const { id } = IdParamsSchema.parse(await context.params);
    const before = await getRequestScenarioById(id);
    const scenario = await updateRequestScenario(id, input);
    const api = await getApiById(scenario.apiId);
    await logChange({
      action: 'UPDATE',
      entityType: 'request_scenario',
      entityId: id,
      projectId: api?.projectId,
      beforeState: before,
      afterState: scenario,
      description: `Updated request scenario '${scenario.name}'`,
    });
    clearInternalProxyCache();
    return ok(scenario);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid request scenario request', 400, 'INVALID_REQUEST_SCENARIO_REQUEST');
    return jsonUnknownError('Request scenario update failed', error, 'Request scenario update failed', 'REQUEST_SCENARIO_UPDATE_FAILED');
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
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
    clearInternalProxyCache();
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Request scenario delete failed', error, 'Request scenario delete failed', 'REQUEST_SCENARIO_DELETE_FAILED');
  }
}
