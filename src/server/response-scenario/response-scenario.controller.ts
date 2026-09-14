import { z } from 'zod';
import { fail, ok, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { generateId } from '@/src/core/utils/uuid';
import { logChange } from '@/src/core/db/change_log_helper';
import { getApiById } from '@/src/server/api';
import { getRequestScenarioById } from '@/src/server/request-scenario';
import { clearInternalProxyCache } from '@/src/server/mock-proxy/mock-proxy.cache';
import { createResponseScenario, getResponseScenarioById, getResponseScenariosByRequestScenarioId, softDeleteResponseScenario, updateResponseScenario } from './response-scenario.repository';

const ObjectSchema = z.record(z.string(), z.unknown());
const IdParamsSchema = z.object({ id: z.string().trim().min(1) });

export async function listResponseScenariosByRequestScenarioRoute(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
    return ok(await getResponseScenariosByRequestScenarioId(id));
  } catch (error) {
    return jsonUnknownError('Response scenario list failed', error, 'Response scenario list failed', 'RESPONSE_SCENARIO_LIST_FAILED');
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
    return ok(await getResponseScenarioById(id));
  } catch (error) {
    return jsonUnknownError('Response scenario request failed', error, 'Response scenario request failed', 'RESPONSE_SCENARIO_REQUEST_FAILED');
  }
}

export async function POST(request: Request) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const now = new Date().toISOString();
    const id = generateId();
    const scenario = await createResponseScenario({ ...input, id, createdAt: now, updatedAt: now } as never);
    const requestScenario = await getRequestScenarioById(scenario.requestScenarioId);
    const api = requestScenario ? await getApiById(requestScenario.apiId) : null;
    await logChange({
      action: 'CREATE',
      entityType: 'response_scenario',
      entityId: id,
      projectId: api?.projectId,
      afterState: scenario,
      description: `Created response scenario '${scenario.name}' (HTTP ${scenario.statusCode})`,
    });
    clearInternalProxyCache();
    return ok(scenario);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid response scenario request', 400, 'INVALID_RESPONSE_SCENARIO_REQUEST');
    return jsonUnknownError('Response scenario create failed', error, 'Response scenario create failed', 'RESPONSE_SCENARIO_CREATE_FAILED');
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const { id } = IdParamsSchema.parse(await context.params);
    const before = await getResponseScenarioById(id);
    const scenario = await updateResponseScenario(id, input);
    const requestScenario = await getRequestScenarioById(scenario.requestScenarioId);
    const api = requestScenario ? await getApiById(requestScenario.apiId) : null;
    await logChange({
      action: 'UPDATE',
      entityType: 'response_scenario',
      entityId: id,
      projectId: api?.projectId,
      beforeState: before,
      afterState: scenario,
      description: `Updated response scenario '${scenario.name}' (HTTP ${scenario.statusCode})`,
    });
    clearInternalProxyCache();
    return ok(scenario);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid response scenario request', 400, 'INVALID_RESPONSE_SCENARIO_REQUEST');
    return jsonUnknownError('Response scenario update failed', error, 'Response scenario update failed', 'RESPONSE_SCENARIO_UPDATE_FAILED');
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
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
    clearInternalProxyCache();
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Response scenario delete failed', error, 'Response scenario delete failed', 'RESPONSE_SCENARIO_DELETE_FAILED');
  }
}
