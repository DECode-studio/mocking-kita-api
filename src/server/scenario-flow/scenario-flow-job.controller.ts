import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ok, fail, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import {
  getScenarioFlowJobs,
  getScenarioFlowJobById,
  createScenarioFlowJob,
  updateScenarioFlowJob,
  deleteScenarioFlowJob,
  getJobExecutions,
} from './scenario-flow-job.repository';
import { flowJobScheduler } from './scenario-flow-job.scheduler';
import { ScenarioFlowJobInput } from './scenario-flow-job.types';
import { exportJobExecutionsReport } from './scenario-flow-job-export.service';


const CreateJobSchema = z.object({
  flowId: z.string().min(1, 'Flow ID is required'),
  projectId: z.string().nullable().optional(),
  environmentId: z.string().nullable().optional(),
  name: z.string().trim().min(1, 'Job name is required'),
  description: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED']).optional(),
  scheduleType: z.enum(['CRON', 'INTERVAL', 'ONCE']),
  cronExpression: z.string().nullable().optional(),
  intervalSeconds: z.number().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  targetMode: z.enum(['LIVE', 'MOCK']).optional(),
  stopCondition: z.enum(['FOREVER', 'MAX_ITERATIONS', 'UNTIL_DATE', 'DATASHEET_EXHAUSTED']),
  maxIterations: z.number().nullable().optional(),
  endAt: z.string().nullable().optional(),
  dataSourceType: z.enum(['NONE', 'STATIC', 'DATASHEET']),
  dataSheetId: z.string().nullable().optional(),
  dataIterationMode: z.enum(['PER_TICK', 'BATCH_ALL']).optional(),
  customVariables: z.record(z.string(), z.unknown()).nullable().optional(),
});

/**
 * GET /api/scenario-flows/jobs or /api/scenario-flows/[id]/jobs
 */
export async function listJobsHandler(request: Request, flowIdParam?: string) {
  try {
    const { searchParams } = new URL(request.url);
    const flowId = flowIdParam || searchParams.get('flowId') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const jobs = await getScenarioFlowJobs({ flowId, projectId, status, search });
    return ok(jobs);
  } catch (error) {
    return jsonUnknownError('Failed to fetch scenario flow jobs', error, 'Job list request failed');
  }
}

/**
 * GET /api/scenario-flows/jobs/[jobId]
 */
export async function getJobByIdHandler(request: Request, jobId: string) {
  try {
    const job = await getScenarioFlowJobById(jobId);
    if (!job) {
      return fail('Job not found', 404, 'JOB_NOT_FOUND');
    }
    return ok(job);
  } catch (error) {
    return jsonUnknownError('Failed to fetch job details', error, 'Job detail request failed');
  }
}

/**
 * POST /api/scenario-flows/jobs or /api/scenario-flows/[id]/jobs
 */
export async function createJobHandler(request: Request, flowIdParam?: string) {
  try {
    const body = await request.json();
    if (flowIdParam && !body.flowId) {
      body.flowId = flowIdParam;
    }

    const parseResult = CreateJobSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(
        parseResult.error.issues.map((i) => i.message).join(', '),
        400,
        'VALIDATION_ERROR'
      );
    }

    const input = parseResult.data as ScenarioFlowJobInput;
    const createdJob = await createScenarioFlowJob(input);

    // If created with ACTIVE status, register into scheduler
    if (createdJob.status === 'ACTIVE') {
      await flowJobScheduler.scheduleJob(createdJob.id);
    }

    return ok(createdJob, { status: 201 });
  } catch (error) {
    return jsonUnknownError('Failed to create job', error, 'Job creation failed');
  }
}

/**
 * PUT /api/scenario-flows/jobs/[jobId]
 */
export async function updateJobHandler(request: Request, jobId: string) {
  try {
    const body = await request.json();
    const existing = await getScenarioFlowJobById(jobId);
    if (!existing) {
      return fail('Job not found', 404, 'JOB_NOT_FOUND');
    }

    const updatedJob = await updateScenarioFlowJob(jobId, body);

    // Refresh scheduler for this job
    if (updatedJob.status === 'ACTIVE') {
      await flowJobScheduler.scheduleJob(updatedJob.id);
    } else {
      flowJobScheduler.stopJob(jobId);
    }

    return ok(updatedJob);
  } catch (error) {
    return jsonUnknownError('Failed to update job', error, 'Job update failed');
  }
}

/**
 * DELETE /api/scenario-flows/jobs/[jobId]
 */
export async function deleteJobHandler(request: Request, jobId: string) {
  try {
    const existing = await getScenarioFlowJobById(jobId);
    if (!existing) {
      return fail('Job not found', 404, 'JOB_NOT_FOUND');
    }

    flowJobScheduler.stopJob(jobId);
    await deleteScenarioFlowJob(jobId);
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Failed to delete job', error, 'Job deletion failed');
  }
}

/**
 * POST /api/scenario-flows/jobs/[jobId]/toggle
 */
export async function toggleJobStatusHandler(request: Request, jobId: string) {
  try {
    const existing = await getScenarioFlowJobById(jobId);
    if (!existing) {
      return fail('Job not found', 404, 'JOB_NOT_FOUND');
    }

    const newStatus = existing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const updated = await updateScenarioFlowJob(jobId, { status: newStatus });

    if (newStatus === 'ACTIVE') {
      await flowJobScheduler.scheduleJob(jobId);
    } else {
      flowJobScheduler.stopJob(jobId);
    }

    return ok(updated);
  } catch (error) {
    return jsonUnknownError('Failed to toggle job status', error, 'Job status toggle failed');
  }
}

/**
 * POST /api/scenario-flows/jobs/[jobId]/run-now
 */
export async function runNowJobHandler(request: Request, jobId: string) {
  try {
    const existing = await getScenarioFlowJobById(jobId);
    if (!existing) {
      return fail('Job not found', 404, 'JOB_NOT_FOUND');
    }

    // Trigger tick asynchronously or await it
    await flowJobScheduler.executeJobTick(jobId, true);
    const refreshed = await getScenarioFlowJobById(jobId);

    return ok(refreshed);
  } catch (error) {
    return jsonUnknownError('Failed to run job now', error, 'Manual job trigger failed');
  }
}

/**
 * GET /api/scenario-flows/jobs/executions
 */
export async function listJobExecutionsHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId') || undefined;
    const flowId = searchParams.get('flowId') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10;

    const result = await getJobExecutions({
      jobId,
      flowId,
      projectId,
      status,
      startDate,
      endDate,
      page,
      limit,
    });

    return ok(result);
  } catch (error) {
    return jsonUnknownError('Failed to fetch job executions', error, 'Job executions fetch failed');
  }
}

/**
 * GET /api/scenario-flows/jobs/executions/export
 */
export async function exportJobExecutionsHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'md') as 'md' | 'csv';
    const executionId = searchParams.get('executionId') || undefined;
    const jobId = searchParams.get('jobId') || undefined;
    const flowId = searchParams.get('flowId') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const flowName = searchParams.get('flowName') || undefined;

    const { content, filename, contentType } = await exportJobExecutionsReport({
      format,
      executionId,
      jobId,
      flowId,
      projectId,
      status,
      startDate,
      endDate,
      flowName,
    });

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    return jsonUnknownError('Failed to export job executions report', error, 'Job execution export failed');
  }
}


