import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ok, fail, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { logChange } from '@/src/core/db/change_log_helper';
import {
  getScenarioFlowsByProjectId,
  getScenarioFlowById,
  createScenarioFlow,
  updateScenarioFlow,
  softDeleteScenarioFlow,
  createScenarioFlowStep,
  getScenarioFlowStepById,
  updateScenarioFlowStep,
  deleteScenarioFlowStep,
  reorderScenarioFlowSteps,
  getExecutionById,
} from './scenario-flow.repository';
import { executeScenarioFlow } from './scenario-flow.runner';
import {
  exportScenarioFlowToTemplate,
  importScenarioFlowFromTemplate,
} from './scenario-flow.import-export';

const IdParamSchema = z.object({ id: z.string().trim().min(1) });
const FlowStepParamSchema = z.object({
  id: z.string().trim().min(1),
  stepId: z.string().trim().min(1),
});

/**
 * GET /api/scenario-flows (list all or by optional ?projectId=...)
 */
export async function listAllScenarioFlows(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const flows = await getScenarioFlowsByProjectId(projectId);
    return ok(flows);
  } catch (error) {
    return jsonUnknownError('Failed to fetch scenario flows', error, 'Scenario flows request failed');
  }
}

/**
 * POST /api/scenario-flows (Create global or project-linked flow)
 */
export async function createGlobalScenarioFlow(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || typeof body.name !== 'string') {
      return fail('Flow name is required', 400, 'INVALID_FLOW_NAME');
    }

    const flow = await createScenarioFlow({
      projectId: body.projectId || null,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      defaultEnvironmentId: body.defaultEnvironmentId || null,
      stopOnFailure: body.stopOnFailure !== false,
      variables: body.variables || {},
    });

    await logChange({
      action: 'CREATE',
      entityType: 'scenario_flow',
      entityId: flow.id,
      projectId: flow.projectId,
      afterState: flow,
      description: `Created scenario flow '${flow.name}'`,
    });

    return ok(flow);
  } catch (error) {
    return jsonUnknownError('Failed to create scenario flow', error, 'Flow creation failed');
  }
}

/**
 * GET /api/projects/[id]/scenario-flows
 */
export async function listScenarioFlowsByProject(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = IdParamSchema.parse(await context.params);
    const flows = await getScenarioFlowsByProjectId(id);
    return ok(flows);
  } catch (error) {
    return jsonUnknownError('Failed to fetch scenario flows', error, 'Scenario flows request failed');
  }
}

/**
 * POST /api/projects/[id]/scenario-flows (Manual creation)
 */
export async function createScenarioFlowRoute(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: projectId } = IdParamSchema.parse(await context.params);
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return fail('Flow name is required', 400, 'INVALID_FLOW_NAME');
    }

    const flow = await createScenarioFlow({
      projectId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      defaultEnvironmentId: body.defaultEnvironmentId || null,
      stopOnFailure: body.stopOnFailure !== false,
      variables: body.variables || {},
    });

    await logChange({
      action: 'CREATE',
      entityType: 'scenario_flow',
      entityId: flow.id,
      projectId,
      afterState: flow,
      description: `Created scenario flow '${flow.name}'`,
    });

    return ok(flow);
  } catch (error) {
    return jsonUnknownError('Failed to create scenario flow', error, 'Flow creation failed');
  }
}

/**
 * POST /api/projects/[id]/scenario-flows/import
 */
export async function importScenarioFlowRoute(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: projectId } = IdParamSchema.parse(await context.params);
    const body = await request.json();

    const result = await importScenarioFlowFromTemplate(projectId, body);

    await logChange({
      action: 'IMPORT',
      entityType: 'scenario_flow',
      entityId: result.flowId,
      projectId,
      afterState: result,
      description: `Imported scenario flow '${result.flowName}' with ${result.stepsCount} steps`,
    });

    return ok(result);
  } catch (error: any) {
    return fail(error.message || 'Failed to import scenario flow template', 400, 'IMPORT_FAILED');
  }
}

/**
 * POST /api/scenario-flows/import
 */
export async function importScenarioFlowGlobalRoute(request: Request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const projectId = body.projectId || searchParams.get('projectId');

    if (!projectId) {
      return fail('projectId is required to import APIs into a project', 400, 'PROJECT_ID_REQUIRED');
    }

    const templateData = body.template || body;
    const result = await importScenarioFlowFromTemplate(projectId, templateData);

    await logChange({
      action: 'IMPORT',
      entityType: 'scenario_flow',
      entityId: result.flowId,
      projectId,
      afterState: result,
      description: `Imported scenario flow '${result.flowName}' with ${result.stepsCount} steps`,
    });

    return ok(result);
  } catch (error: any) {
    return fail(error.message || 'Failed to import scenario flow template', 400, 'IMPORT_FAILED');
  }
}

/**
 * GET /api/scenario-flows/[id]
 */
export async function getScenarioFlowDetail(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = IdParamSchema.parse(await context.params);
    const flow = await getScenarioFlowById(id);
    if (!flow) {
      return fail('Scenario flow not found', 404, 'FLOW_NOT_FOUND');
    }
    return ok(flow);
  } catch (error) {
    return jsonUnknownError('Failed to fetch scenario flow', error, 'Flow fetch failed');
  }
}

/**
 * PUT /api/scenario-flows/[id]
 */
export async function updateScenarioFlowRoute(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = IdParamSchema.parse(await context.params);
    const body = await request.json();

    const before = await getScenarioFlowById(id);
    const updated = await updateScenarioFlow(id, body);

    await logChange({
      action: 'UPDATE',
      entityType: 'scenario_flow',
      entityId: id,
      projectId: before?.projectId,
      beforeState: before,
      afterState: updated,
      description: `Updated scenario flow '${updated.name}'`,
    });

    return ok(updated);
  } catch (error) {
    return jsonUnknownError('Failed to update scenario flow', error, 'Flow update failed');
  }
}

/**
 * DELETE /api/scenario-flows/[id]
 */
export async function deleteScenarioFlowRoute(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = IdParamSchema.parse(await context.params);
    const before = await getScenarioFlowById(id);
    await softDeleteScenarioFlow(id);

    await logChange({
      action: 'DELETE',
      entityType: 'scenario_flow',
      entityId: id,
      projectId: before?.projectId,
      beforeState: before,
      description: `Deleted scenario flow '${before?.name}'`,
    });

    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Failed to delete scenario flow', error, 'Flow delete failed');
  }
}

/**
 * POST /api/scenario-flows/[id]/steps
 */
export async function addScenarioFlowStepRoute(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: flowId } = IdParamSchema.parse(await context.params);
    const body = await request.json();

    const flow = await getScenarioFlowById(flowId);
    const step = await createScenarioFlowStep(flowId, body);

    await logChange({
      action: 'CREATE',
      entityType: 'scenario_flow',
      entityId: flowId,
      projectId: flow?.projectId,
      afterState: { id: flowId, name: flow?.name, step },
      description: `Added step '${step.name}' to scenario flow '${flow?.name || flowId}'`,
    });

    return ok(step);
  } catch (error) {
    return jsonUnknownError('Failed to add flow step', error, 'Step creation failed');
  }
}

/**
 * PUT /api/scenario-flows/[id]/steps/[stepId]
 */
export async function updateScenarioFlowStepRoute(
  request: Request,
  context: { params: Promise<{ id: string; stepId: string }> | { id: string; stepId: string } }
) {
  try {
    const { stepId } = FlowStepParamSchema.parse(await context.params);
    const body = await request.json();

    const before = await getScenarioFlowStepById(stepId);
    const updated = await updateScenarioFlowStep(stepId, body);

    await logChange({
      action: 'UPDATE',
      entityType: 'scenario_flow',
      entityId: before?.flowId || before?.flow?.id,
      projectId: before?.flow?.projectId,
      beforeState: before,
      afterState: { id: before?.flowId, name: before?.flow?.name, step: updated },
      description: `Updated step '${updated.name}' in scenario flow '${before?.flow?.name || before?.flowId}'`,
    });

    return ok(updated);
  } catch (error) {
    return jsonUnknownError('Failed to update flow step', error, 'Step update failed');
  }
}

/**
 * DELETE /api/scenario-flows/[id]/steps/[stepId]
 */
export async function deleteScenarioFlowStepRoute(
  _request: Request,
  context: { params: Promise<{ id: string; stepId: string }> | { id: string; stepId: string } }
) {
  try {
    const { stepId } = FlowStepParamSchema.parse(await context.params);
    const before = await getScenarioFlowStepById(stepId);
    await deleteScenarioFlowStep(stepId);

    await logChange({
      action: 'DELETE',
      entityType: 'scenario_flow',
      entityId: before?.flowId || before?.flow?.id,
      projectId: before?.flow?.projectId,
      beforeState: before,
      afterState: { id: before?.flowId, name: before?.flow?.name },
      description: `Deleted step '${before?.name || stepId}' from scenario flow '${before?.flow?.name || before?.flowId}'`,
    });

    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Failed to delete flow step', error, 'Step delete failed');
  }
}

/**
 * PUT /api/scenario-flows/[id]/steps/reorder
 */
export async function reorderScenarioFlowStepsRoute(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: flowId } = IdParamSchema.parse(await context.params);
    const { stepIds } = await request.json();

    if (!Array.isArray(stepIds)) {
      return fail('stepIds must be an array of IDs', 400, 'INVALID_STEP_IDS');
    }

    const flow = await getScenarioFlowById(flowId);
    await reorderScenarioFlowSteps(flowId, stepIds);

    await logChange({
      action: 'UPDATE',
      entityType: 'scenario_flow',
      entityId: flowId,
      projectId: flow?.projectId,
      beforeState: flow,
      afterState: { id: flowId, name: flow?.name, stepIds },
      description: `Reordered steps in scenario flow '${flow?.name || flowId}'`,
    });

    return ok({ success: true });
  } catch (error) {
    return jsonUnknownError('Failed to reorder flow steps', error, 'Step reorder failed');
  }
}

/**
 * POST /api/scenario-flows/[id]/run (Server-Side Real Testing Runner)
 */
export async function runScenarioFlowRoute(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: flowId } = IdParamSchema.parse(await context.params);
    const body = await request.json().catch(() => ({}));

    const result = await executeScenarioFlow(flowId, {
      environmentId: body.environmentId,
      environmentType: body.environmentType || null,
      targetMode: body.targetMode || 'LIVE',
      initialVariables: body.initialVariables,
      executedBy: body.executedBy || 'User',
    });

    return ok(result);
  } catch (error: any) {
    return fail(error.message || 'Execution error', 500, 'EXECUTION_FAILED');
  }
}

/**
 * GET /api/scenario-flows/[id]/export (Export template JSON)
 */
export async function exportScenarioFlowRoute(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: flowId } = IdParamSchema.parse(await context.params);
    const template = await exportScenarioFlowToTemplate(flowId);

    return new NextResponse(JSON.stringify(template, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${template.flow.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_scenario_flow.json"`,
      },
    });
  } catch (error: any) {
    return fail(error.message || 'Failed to export scenario flow', 500, 'EXPORT_FAILED');
  }
}

/**
 * GET /api/scenario-flows/executions/[id]
 */
export async function getExecutionDetailRoute(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: executionId } = IdParamSchema.parse(await context.params);
    const execution = await getExecutionById(executionId);
    if (!execution) {
      return fail('Execution record not found', 404, 'EXECUTION_NOT_FOUND');
    }
    return ok(execution);
  } catch (error) {
    return jsonUnknownError('Failed to fetch execution record', error, 'Execution fetch failed');
  }
}
