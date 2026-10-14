import prisma from '@/src/core/db/prisma-client';
import { Prisma } from '@prisma/client';
import { ScenarioFlowJobInput, ScenarioFlowJobEntity } from './scenario-flow-job.types';

export async function getScenarioFlowJobs(params: {
  flowId?: string;
  projectId?: string;
  status?: string;
  search?: string;
}): Promise<ScenarioFlowJobEntity[]> {
  const where: Prisma.ScenarioFlowJobWhereInput = {
    deletedAt: null,
  };

  if (params.flowId) {
    where.flowId = params.flowId;
  }
  if (params.projectId) {
    where.projectId = params.projectId;
  }
  if (params.status && params.status !== 'ALL') {
    where.status = params.status;
  }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { flow: { name: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const jobs = await prisma.scenarioFlowJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      flow: {
        select: { id: true, name: true },
      },
      environment: {
        select: { id: true, name: true },
      },
      dataSheet: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  return jobs as unknown as ScenarioFlowJobEntity[];
}

export async function getScenarioFlowJobById(id: string): Promise<ScenarioFlowJobEntity | null> {
  const job = await prisma.scenarioFlowJob.findFirst({
    where: { id, deletedAt: null },
    include: {
      flow: {
        select: { id: true, name: true },
      },
      environment: {
        select: { id: true, name: true },
      },
      dataSheet: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  return job as unknown as ScenarioFlowJobEntity | null;
}

export async function createScenarioFlowJob(input: ScenarioFlowJobInput): Promise<ScenarioFlowJobEntity> {
  const job = await prisma.scenarioFlowJob.create({
    data: {
      projectId: input.projectId || null,
      flowId: input.flowId,
      environmentId: input.environmentId || null,
      name: input.name,
      description: input.description || null,
      status: input.status || 'ACTIVE',
      scheduleType: input.scheduleType,
      cronExpression: input.cronExpression || null,
      intervalSeconds: input.intervalSeconds || null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      targetMode: input.targetMode || 'LIVE',
      stopCondition: input.stopCondition || 'FOREVER',
      maxIterations: input.maxIterations ? Number(input.maxIterations) : null,
      currentIteration: 0,
      endAt: input.endAt ? new Date(input.endAt) : null,
      dataSourceType: input.dataSourceType || 'NONE',
      dataSheetId: input.dataSheetId || null,
      dataIterationMode: input.dataIterationMode || 'PER_TICK',
      dataSheetCurrentIndex: 0,
      customVariables: (input.customVariables as Prisma.InputJsonValue) || null,
    },
    include: {
      flow: {
        select: { id: true, name: true },
      },
      environment: {
        select: { id: true, name: true },
      },
      dataSheet: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  return job as unknown as ScenarioFlowJobEntity;
}

export async function updateScenarioFlowJob(
  id: string,
  input: Partial<ScenarioFlowJobInput> & {
    dataSheetCurrentIndex?: number;
    currentIteration?: number;
    lastRunAt?: Date | null;
    nextRunAt?: Date | null;
    lastStatus?: string | null;
    lastError?: string | null;
    totalRuns?: number;
    successRuns?: number;
    failedRuns?: number;
  }
): Promise<ScenarioFlowJobEntity> {
  const data: Prisma.ScenarioFlowJobUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.scheduleType !== undefined) data.scheduleType = input.scheduleType;
  if (input.cronExpression !== undefined) data.cronExpression = input.cronExpression;
  if (input.intervalSeconds !== undefined) data.intervalSeconds = input.intervalSeconds;
  if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (input.targetMode !== undefined) data.targetMode = input.targetMode;
  if (input.stopCondition !== undefined) data.stopCondition = input.stopCondition;
  if (input.maxIterations !== undefined) data.maxIterations = input.maxIterations ? Number(input.maxIterations) : null;
  if (input.currentIteration !== undefined) data.currentIteration = input.currentIteration;
  if (input.endAt !== undefined) data.endAt = input.endAt ? new Date(input.endAt) : null;
  if (input.dataSheetId !== undefined) {
    data.dataSheet = input.dataSheetId ? { connect: { id: input.dataSheetId } } : { disconnect: true };
  }
  if (input.dataIterationMode !== undefined) data.dataIterationMode = input.dataIterationMode;
  if (input.dataSheetCurrentIndex !== undefined) data.dataSheetCurrentIndex = input.dataSheetCurrentIndex;
  if (input.customVariables !== undefined) data.customVariables = input.customVariables as Prisma.InputJsonValue;
  if (input.environmentId !== undefined) {
    data.environment = input.environmentId ? { connect: { id: input.environmentId } } : { disconnect: true };
  }
  if (input.lastRunAt !== undefined) data.lastRunAt = input.lastRunAt;
  if (input.nextRunAt !== undefined) data.nextRunAt = input.nextRunAt;
  if (input.lastStatus !== undefined) data.lastStatus = input.lastStatus;
  if (input.lastError !== undefined) data.lastError = input.lastError;
  if (input.totalRuns !== undefined) data.totalRuns = input.totalRuns;
  if (input.successRuns !== undefined) data.successRuns = input.successRuns;
  if (input.failedRuns !== undefined) data.failedRuns = input.failedRuns;

  const job = await prisma.scenarioFlowJob.update({
    where: { id },
    data,
    include: {
      flow: {
        select: { id: true, name: true },
      },
      environment: {
        select: { id: true, name: true },
      },
      dataSheet: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  return job as unknown as ScenarioFlowJobEntity;
}

export async function deleteScenarioFlowJob(id: string, hardDelete = false) {
  if (hardDelete) {
    return prisma.scenarioFlowJob.delete({
      where: { id },
    });
  }
  return prisma.scenarioFlowJob.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'PAUSED',
    },
  });
}

export interface GetJobExecutionsParams {
  jobId?: string;
  flowId?: string;
  projectId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getJobExecutions(params: GetJobExecutionsParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(1000, params.limit || 10));

  const where: Prisma.ScenarioFlowExecutionWhereInput = {};

  if (params.jobId) {
    where.jobId = params.jobId;
  } else {
    // If no specific job is requested, match executions that have a jobId or are triggered by a job
    where.OR = [
      { jobId: { not: null } },
      { triggerSource: 'SCHEDULED_JOB' },
    ];
  }

  if (params.flowId) {
    where.flowId = params.flowId;
  }

  if (params.projectId) {
    where.flow = {
      projectId: params.projectId,
    };
  }

  if (params.status && params.status !== 'ALL') {
    where.status = params.status;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      if (params.endDate.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
      where.createdAt.lte = end;
    }
  }

  const [total, items] = await Promise.all([
    prisma.scenarioFlowExecution.count({ where }),
    prisma.scenarioFlowExecution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        job: {
          select: {
            id: true,
            name: true,
            scheduleType: true,
            cronExpression: true,
            intervalSeconds: true,
          },
        },
        flow: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
          },
        },
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

