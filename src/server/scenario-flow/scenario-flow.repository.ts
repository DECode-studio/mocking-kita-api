import prisma from '@/src/core/db/prisma-client';
import { Prisma } from '@prisma/client';
import { ScenarioFlowInput, ScenarioFlowStepInput } from './scenario-flow.types';

export async function getScenarioFlowsByProjectId(projectId?: string) {
  return prisma.scenarioFlow.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      deletedAt: null,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
      defaultEnvironment: {
        select: { id: true, name: true, environmentType: true, variables: true },
      },
      steps: {
        where: {},
        orderBy: { stepOrder: 'asc' },
        select: {
          id: true,
          stepOrder: true,
          name: true,
          enabled: true,
          apiId: true,
          api: {
            select: {
              id: true,
              name: true,
              methodRequest: true,
              path: true,
              projectId: true,
              project: { select: { id: true, name: true } },
            },
          },
        },
      },
      executions: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          durationMs: true,
          passedSteps: true,
          totalSteps: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getScenarioFlowById(id: string) {
  return prisma.scenarioFlow.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
      defaultEnvironment: {
        select: { id: true, name: true, environmentType: true, variables: true },
      },
      steps: {
        orderBy: { stepOrder: 'asc' },
        include: {
          api: {
            select: {
              id: true,
              name: true,
              methodRequest: true,
              path: true,
              projectId: true,
              project: { select: { id: true, name: true } },
              collection: { select: { id: true, name: true } },
              apiEnvironments: {
                where: { enabled: true },
                include: {
                  environment: true,
                },
              },
            },
          },
          requestScenario: {
            select: {
              id: true,
              name: true,
              headers: true,
              queryParams: true,
              pathParams: true,
              body: true,
              bodyType: true,
            },
          },
        },
      },
      executions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          targetMode: true,
          durationMs: true,
          totalSteps: true,
          passedSteps: true,
          failedSteps: true,
          executedBy: true,
          createdAt: true,
          environment: {
            select: { id: true, name: true, environmentType: true },
          },
        },
      },
    },
  });
}

export async function createScenarioFlow(data: ScenarioFlowInput) {
  return prisma.scenarioFlow.create({
    data: {
      id: data.id,
      projectId: data.projectId ?? null,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? true,
      defaultEnvironmentId: data.defaultEnvironmentId ?? null,
      stopOnFailure: data.stopOnFailure ?? true,
      variables: (data.variables as Prisma.InputJsonValue) ?? {},
    },
    include: {
      steps: true,
      project: { select: { id: true, name: true } },
    },
  });
}

export async function updateScenarioFlow(id: string, data: Partial<ScenarioFlowInput>) {
  return prisma.scenarioFlow.update({
    where: { id },
    data: {
      ...(data.projectId !== undefined ? { projectId: data.projectId ?? null } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.defaultEnvironmentId !== undefined ? { defaultEnvironmentId: data.defaultEnvironmentId } : {}),
      ...(data.stopOnFailure !== undefined ? { stopOnFailure: data.stopOnFailure } : {}),
      ...(data.variables !== undefined ? { variables: data.variables as Prisma.InputJsonValue } : {}),
      updatedAt: new Date(),
    },
  });
}

export async function softDeleteScenarioFlow(id: string) {
  return prisma.scenarioFlow.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function createScenarioFlowStep(flowId: string, input: ScenarioFlowStepInput) {
  // If stepOrder is not specified or 0, append at the end
  let order = input.stepOrder;
  if (!order || order <= 0) {
    const highestStep = await prisma.scenarioFlowStep.findFirst({
      where: { flowId },
      orderBy: { stepOrder: 'desc' },
      select: { stepOrder: true },
    });
    order = (highestStep?.stepOrder ?? 0) + 1;
  }

  return prisma.scenarioFlowStep.create({
    data: {
      id: input.id,
      flowId,
      apiId: input.apiId ?? null,
      requestScenarioId: input.requestScenarioId ?? null,
      stepOrder: order,
      name: input.name,
      description: input.description ?? null,
      enabled: input.enabled ?? true,
      delayMs: input.delayMs ?? 0,
      continueOnError: input.continueOnError ?? false,
      methodOverride: input.methodOverride ?? null,
      pathOverride: input.pathOverride ?? null,
      headersOverride: (input.headersOverride as Prisma.InputJsonValue) ?? null,
      queryParamsOverride: (input.queryParamsOverride as Prisma.InputJsonValue) ?? null,
      pathParamsOverride: (input.pathParamsOverride as Prisma.InputJsonValue) ?? null,
      bodyOverride: (input.bodyOverride as Prisma.InputJsonValue) ?? null,
      extractors: (input.extractors as unknown as Prisma.InputJsonValue) ?? [],
      assertions: (input.assertions as unknown as Prisma.InputJsonValue) ?? [],
      targetEnvironmentType: input.targetEnvironmentType ?? 'DEFAULT',
      targetEnvironment: input.targetEnvironment ?? null,
    },
    include: {
      api: {
        select: { id: true, name: true, methodRequest: true, path: true },
      },
      requestScenario: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function updateScenarioFlowStep(stepId: string, input: Partial<ScenarioFlowStepInput>) {
  return prisma.scenarioFlowStep.update({
    where: { id: stepId },
    data: {
      ...(input.apiId !== undefined ? { apiId: input.apiId } : {}),
      ...(input.requestScenarioId !== undefined ? { requestScenarioId: input.requestScenarioId } : {}),
      ...(input.stepOrder !== undefined ? { stepOrder: input.stepOrder } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.delayMs !== undefined ? { delayMs: input.delayMs } : {}),
      ...(input.continueOnError !== undefined ? { continueOnError: input.continueOnError } : {}),
      ...(input.methodOverride !== undefined ? { methodOverride: input.methodOverride } : {}),
      ...(input.pathOverride !== undefined ? { pathOverride: input.pathOverride } : {}),
      ...(input.headersOverride !== undefined ? { headersOverride: input.headersOverride as Prisma.InputJsonValue } : {}),
      ...(input.queryParamsOverride !== undefined ? { queryParamsOverride: input.queryParamsOverride as Prisma.InputJsonValue } : {}),
      ...(input.pathParamsOverride !== undefined ? { pathParamsOverride: input.pathParamsOverride as Prisma.InputJsonValue } : {}),
      ...(input.bodyOverride !== undefined ? { bodyOverride: input.bodyOverride as Prisma.InputJsonValue } : {}),
      ...(input.extractors !== undefined ? { extractors: input.extractors as unknown as Prisma.InputJsonValue } : {}),
      ...(input.assertions !== undefined ? { assertions: input.assertions as unknown as Prisma.InputJsonValue } : {}),
      ...(input.targetEnvironmentType !== undefined ? { targetEnvironmentType: input.targetEnvironmentType } : {}),
      ...(input.targetEnvironment !== undefined ? { targetEnvironment: input.targetEnvironment } : {}),
      updatedAt: new Date(),
    },
  });
}

export async function getScenarioFlowStepById(stepId: string) {
  return prisma.scenarioFlowStep.findUnique({
    where: { id: stepId },
    include: {
      flow: { select: { id: true, name: true, projectId: true } },
    },
  });
}

export async function deleteScenarioFlowStep(stepId: string) {
  return prisma.scenarioFlowStep.delete({
    where: { id: stepId },
  });
}

export async function reorderScenarioFlowSteps(flowId: string, stepIds: string[]) {
  return prisma.$transaction(
    stepIds.map((id, index) =>
      prisma.scenarioFlowStep.update({
        where: { id },
        data: { stepOrder: index + 1 },
      })
    )
  );
}

export async function createExecutionRecord(data: {
  flowId: string;
  environmentId?: string | null;
  targetMode: 'LIVE' | 'MOCK';
  totalSteps: number;
  initialVariables?: any;
  executedBy?: string;
}) {
  return prisma.scenarioFlowExecution.create({
    data: {
      flowId: data.flowId,
      environmentId: data.environmentId ?? null,
      status: 'RUNNING',
      targetMode: data.targetMode,
      totalSteps: data.totalSteps,
      initialVariables: data.initialVariables ?? {},
      executedBy: data.executedBy ?? null,
    },
  });
}

export async function updateExecutionRecord(
  id: string,
  data: {
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
    passedSteps: number;
    failedSteps: number;
    durationMs: number;
    finalVariables?: any;
    errorSummary?: string | null;
  }
) {
  return prisma.scenarioFlowExecution.update({
    where: { id },
    data: {
      status: data.status,
      passedSteps: data.passedSteps,
      failedSteps: data.failedSteps,
      durationMs: data.durationMs,
      finalVariables: data.finalVariables ?? {},
      errorSummary: data.errorSummary ?? null,
    },
  });
}

export async function createExecutionStepRecord(data: {
  executionId: string;
  flowStepId?: string | null;
  stepOrder: number;
  stepName: string;
  method: string;
  url: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  httpStatusCode?: number | null;
  durationMs: number;
  requestSnapshot?: any;
  responseSnapshot?: any;
  extractedVariables?: any;
  assertionResults?: any;
  errorMessage?: string | null;
}) {
  return prisma.scenarioFlowExecutionStep.create({
    data: {
      executionId: data.executionId,
      flowStepId: data.flowStepId ?? null,
      stepOrder: data.stepOrder,
      stepName: data.stepName,
      method: data.method,
      url: data.url,
      status: data.status,
      httpStatusCode: data.httpStatusCode ?? null,
      durationMs: data.durationMs,
      requestSnapshot: data.requestSnapshot ?? null,
      responseSnapshot: data.responseSnapshot ?? null,
      extractedVariables: data.extractedVariables ?? null,
      assertionResults: data.assertionResults ?? null,
      errorMessage: data.errorMessage ?? null,
    },
  });
}

export async function getExecutionById(executionId: string) {
  return prisma.scenarioFlowExecution.findUnique({
    where: { id: executionId },
    include: {
      flow: { select: { id: true, name: true, projectId: true } },
      environment: { select: { id: true, name: true, environmentType: true, variables: true } },
      steps: {
        orderBy: { stepOrder: 'asc' },
      },
    },
  });
}
