import { z } from 'zod';
import { fail, ok, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { generateId } from '@/src/core/utils/uuid';
import { clearInternalProxyCache } from '@/src/modules/mock-proxy/mock-proxy.cache';
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
    const scenario = await createResponseScenario({ ...input, id: generateId(), createdAt: now, updatedAt: now } as never);
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
    const scenario = await updateResponseScenario(id, input);
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
    await softDeleteResponseScenario(id);
    clearInternalProxyCache();
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Response scenario delete failed', error, 'Response scenario delete failed', 'RESPONSE_SCENARIO_DELETE_FAILED');
  }
}
