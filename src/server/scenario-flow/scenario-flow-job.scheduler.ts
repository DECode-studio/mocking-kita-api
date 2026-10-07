import cron from 'node-cron';
import cronParser from 'cron-parser';
import prisma from '@/src/core/db/prisma-client';
import { executeScenarioFlow } from './scenario-flow.runner';
import {
  getScenarioFlowJobById,
  updateScenarioFlowJob,
} from './scenario-flow-job.repository';
import { ScenarioFlowJobEntity } from './scenario-flow-job.types';
import { sendJobFailureGoogleSpaceNotification } from '@/src/core/notification/google_space_notifier';

interface RunningTask {
  stop: () => void;
  type: 'cron' | 'interval' | 'timeout';
}

class ScenarioFlowJobScheduler {
  private activeTasks = new Map<string, RunningTask>();
  private isInitialized = false;

  public async init() {
    if (this.isInitialized) {
      console.log('[ScenarioFlowJobScheduler] Already initialized.');
      return;
    }
    this.isInitialized = true;
    console.log('[ScenarioFlowJobScheduler] Initializing Job Scheduler...');

    try {
      const activeJobs = await prisma.scenarioFlowJob.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      });

      console.log(`[ScenarioFlowJobScheduler] Found ${activeJobs.length} active jobs to register.`);
      for (const job of activeJobs) {
        await this.scheduleJob(job.id);
      }
    } catch (error) {
      console.error('[ScenarioFlowJobScheduler] Error during initialization:', error);
    }
  }

  public getNextRunDate(
    scheduleType: string,
    cronExpression?: string | null,
    intervalSeconds?: number | null,
    scheduledAt?: Date | null
  ): Date | null {
    try {
      const now = new Date();
      if (scheduleType === 'CRON' && cronExpression) {
        if (!cron.validate(cronExpression)) return null;
        const interval = cronParser.parse(cronExpression, { currentDate: now });
        return interval.next().toDate();
      }
      if (scheduleType === 'INTERVAL' && intervalSeconds && intervalSeconds > 0) {
        return new Date(now.getTime() + intervalSeconds * 1000);
      }
      if (scheduleType === 'ONCE' && scheduledAt) {
        const scheduledDate = new Date(scheduledAt);
        return scheduledDate > now ? scheduledDate : null;
      }
    } catch (err) {
      console.error('[ScenarioFlowJobScheduler] Error computing next run date:', err);
    }
    return null;
  }

  public async scheduleJob(jobOrId: string | ScenarioFlowJobEntity) {
    const jobId = typeof jobOrId === 'string' ? jobOrId : jobOrId.id;

    // Stop any existing in-memory task
    this.stopJob(jobId);

    const job = await getScenarioFlowJobById(jobId);
    if (!job || job.status !== 'ACTIVE' || job.deletedAt) {
      return;
    }

    const nextRun = this.getNextRunDate(
      job.scheduleType,
      job.cronExpression,
      job.intervalSeconds,
      job.scheduledAt
    );

    // Update nextRunAt in database
    await updateScenarioFlowJob(job.id, { nextRunAt: nextRun });

    if (job.scheduleType === 'CRON' && job.cronExpression) {
      if (!cron.validate(job.cronExpression)) {
        console.error(`[ScenarioFlowJobScheduler] Invalid cron expression '${job.cronExpression}' for job '${job.id}'`);
        await updateScenarioFlowJob(job.id, {
          status: 'FAILED',
          lastError: `Invalid cron expression: ${job.cronExpression}`,
        });
        return;
      }

      const task = cron.schedule(job.cronExpression, async () => {
        await this.executeJobTick(job.id);
      });

      this.activeTasks.set(job.id, {
        stop: () => task.stop(),
        type: 'cron',
      });
      console.log(`[ScenarioFlowJobScheduler] Registered CRON job '${job.name}' (${job.id}) [${job.cronExpression}]`);
    } else if (job.scheduleType === 'INTERVAL' && job.intervalSeconds && job.intervalSeconds > 0) {
      const intervalMs = Math.max(job.intervalSeconds * 1000, 1000); // minimum 1 second
      const timer = setInterval(async () => {
        await this.executeJobTick(job.id);
      }, intervalMs);

      this.activeTasks.set(job.id, {
        stop: () => clearInterval(timer),
        type: 'interval',
      });
      console.log(`[ScenarioFlowJobScheduler] Registered INTERVAL job '${job.name}' (${job.id}) every ${job.intervalSeconds}s`);
    } else if (job.scheduleType === 'ONCE' && job.scheduledAt) {
      const delayMs = new Date(job.scheduledAt).getTime() - Date.now();
      if (delayMs <= 0) {
        // Run immediately or mark completed
        await this.executeJobTick(job.id);
      } else {
        const timeout = setTimeout(async () => {
          await this.executeJobTick(job.id);
        }, delayMs);

        this.activeTasks.set(job.id, {
          stop: () => clearTimeout(timeout),
          type: 'timeout',
        });
        console.log(`[ScenarioFlowJobScheduler] Registered ONCE job '${job.name}' (${job.id}) in ${Math.round(delayMs / 1000)}s`);
      }
    }
  }

  public stopJob(jobId: string) {
    const existing = this.activeTasks.get(jobId);
    if (existing) {
      try {
        existing.stop();
      } catch (err) {
        console.error(`[ScenarioFlowJobScheduler] Error stopping job ${jobId}:`, err);
      }
      this.activeTasks.delete(jobId);
      console.log(`[ScenarioFlowJobScheduler] Stopped job ${jobId}`);
    }
  }

  public async executeJobTick(jobId: string, isManualRun = false) {
    const job = await getScenarioFlowJobById(jobId);
    if (!job) {
      this.stopJob(jobId);
      return;
    }

    if (!isManualRun && job.status !== 'ACTIVE') {
      this.stopJob(jobId);
      return;
    }

    const now = new Date();

    // Check stop condition: UNTIL_DATE
    if (!isManualRun && job.stopCondition === 'UNTIL_DATE' && job.endAt && now >= new Date(job.endAt)) {
      console.log(`[ScenarioFlowJobScheduler] Job '${job.name}' reached end date. Marking COMPLETED.`);
      this.stopJob(jobId);
      await updateScenarioFlowJob(jobId, { status: 'COMPLETED', nextRunAt: null });
      return;
    }

    // Check stop condition: MAX_ITERATIONS
    if (!isManualRun && job.stopCondition === 'MAX_ITERATIONS' && job.maxIterations && job.currentIteration >= job.maxIterations) {
      console.log(`[ScenarioFlowJobScheduler] Job '${job.name}' reached max iterations (${job.maxIterations}). Marking COMPLETED.`);
      this.stopJob(jobId);
      await updateScenarioFlowJob(jobId, { status: 'COMPLETED', nextRunAt: null });
      return;
    }

    let isSuccess = true;
    let errorMessage: string | null = null;
    let nextIndex = job.dataSheetCurrentIndex;
    const newIterationCount = job.currentIteration + 1;

    const handleFlowExecutionResult = async (result: any) => {
      if (result?.execution?.status === 'FAILED') {
        isSuccess = false;
        const failedStep = result.steps?.find((s: any) => s.status === 'FAILED');
        const errText = result.execution.errorSummary || failedStep?.errorMessage || 'Step execution or assertion failed';
        if (!errorMessage) {
          errorMessage = errText;
        }

        try {
          await sendJobFailureGoogleSpaceNotification({
            jobId: job.id,
            jobName: job.name,
            flowId: job.flowId,
            flowName: job.flow?.name || 'Scenario Flow',
            projectId: job.projectId,
            environmentName: job.environment?.name || undefined,
            iteration: newIterationCount,
            totalIterations: job.maxIterations || undefined,
            failedStepName: failedStep?.stepName || failedStep?.name || undefined,
            failedStepOrder: failedStep?.stepOrder || undefined,
            failedStepUrl: failedStep?.resolvedUrl || failedStep?.url || undefined,
            failedStepMethod: failedStep?.method || undefined,
            httpStatusCode: failedStep?.httpStatusCode || undefined,
            errorMessage: errText,
            scheduleType: job.scheduleType,
            cronExpression: job.cronExpression || undefined,
          });
        } catch (notifErr) {
          console.error('[ScenarioFlowJobScheduler] Failed to send Google Space notification:', notifErr);
        }
      }
    };

    try {
      console.log(`[ScenarioFlowJobScheduler] Executing tick for job '${job.name}' (${job.id}) - Iteration #${newIterationCount}`);

      if (job.dataSourceType === 'DATASHEET' && job.dataSheetId) {
        const datasheet = await prisma.dataSheet.findUnique({
          where: { id: job.dataSheetId },
        });

        const rows = (Array.isArray(datasheet?.data) ? datasheet.data : []) as any[];

        if (rows.length === 0) {
          if (job.stopCondition === 'DATASHEET_EXHAUSTED') {
            console.log(`[ScenarioFlowJobScheduler] DataSheet for job '${job.name}' is empty. Marking COMPLETED.`);
            this.stopJob(jobId);
            await updateScenarioFlowJob(jobId, { status: 'COMPLETED', nextRunAt: null });
            return;
          }
          // Run with just custom variables or empty
          const result = await executeScenarioFlow(job.flowId, {
            environmentId: job.environmentId || undefined,
            targetMode: job.targetMode,
            jobId: job.id,
            triggerSource: 'SCHEDULED_JOB',
            executedBy: `Job: ${job.name}`,
            initialVariables: (job.customVariables as Record<string, any>) || {},
          });
          await handleFlowExecutionResult(result);
        } else if (job.dataIterationMode === 'BATCH_ALL') {
          // Execute flow for every row in data sheet
          for (let r = 0; r < rows.length; r++) {
            const rowData = rows[r];
            const rowVariables = {
              ...(job.customVariables as Record<string, any> || {}),
              ...(typeof rowData === 'object' && rowData !== null ? rowData : { item: rowData }),
              _rowIndex: r,
            };
            const result = await executeScenarioFlow(job.flowId, {
              environmentId: job.environmentId || undefined,
              targetMode: job.targetMode,
              jobId: job.id,
              triggerSource: 'SCHEDULED_JOB',
              executedBy: `Job: ${job.name} (Row ${r + 1}/${rows.length})`,
              initialVariables: rowVariables,
            });
            await handleFlowExecutionResult(result);
          }
        } else {
          // PER_TICK: Execute 1 row per tick
          const currentIndex = job.dataSheetCurrentIndex % rows.length;
          const rowData = rows[currentIndex];
          const rowVariables = {
            ...(job.customVariables as Record<string, any> || {}),
            ...(typeof rowData === 'object' && rowData !== null ? rowData : { item: rowData }),
            _rowIndex: currentIndex,
          };

          const result = await executeScenarioFlow(job.flowId, {
            environmentId: job.environmentId || undefined,
            targetMode: job.targetMode,
            jobId: job.id,
            triggerSource: 'SCHEDULED_JOB',
            executedBy: `Job: ${job.name} (Row ${currentIndex + 1})`,
            initialVariables: rowVariables,
          });
          await handleFlowExecutionResult(result);

          nextIndex = job.dataSheetCurrentIndex + 1;

          // Check if data sheet is exhausted
          if (nextIndex >= rows.length && job.stopCondition === 'DATASHEET_EXHAUSTED') {
            console.log(`[ScenarioFlowJobScheduler] Job '${job.name}' exhausted DataSheet rows. Marking COMPLETED.`);
            this.stopJob(jobId);
            await updateScenarioFlowJob(jobId, {
              status: 'COMPLETED',
              lastRunAt: now,
              nextRunAt: null,
              lastStatus: isSuccess ? 'SUCCESS' : 'FAILED',
              lastError: errorMessage,
              currentIteration: newIterationCount,
              dataSheetCurrentIndex: nextIndex,
              totalRuns: job.totalRuns + 1,
              successRuns: isSuccess ? job.successRuns + 1 : job.successRuns,
              failedRuns: !isSuccess ? job.failedRuns + 1 : job.failedRuns,
            });
            return;
          }
        }
      } else {
        // STATIC or NONE
        const initialVars = (job.customVariables as Record<string, any>) || {};
        const result = await executeScenarioFlow(job.flowId, {
          environmentId: job.environmentId || undefined,
          targetMode: job.targetMode,
          jobId: job.id,
          triggerSource: 'SCHEDULED_JOB',
          executedBy: `Job: ${job.name}`,
          initialVariables: initialVars,
        });
        await handleFlowExecutionResult(result);
      }
    } catch (err: any) {
      isSuccess = false;
      errorMessage = err?.message || 'Unknown error occurred during job run';
      console.error(`[ScenarioFlowJobScheduler] Error executing job '${job.name}':`, err);

      try {
        await sendJobFailureGoogleSpaceNotification({
          jobId: job.id,
          jobName: job.name,
          flowId: job.flowId,
          flowName: job.flow?.name || 'Scenario Flow',
          projectId: job.projectId,
          environmentName: job.environment?.name || undefined,
          iteration: newIterationCount,
          totalIterations: job.maxIterations || undefined,
          errorMessage: errorMessage || 'Execution crashed with an unhandled exception',
          scheduleType: job.scheduleType,
          cronExpression: job.cronExpression || undefined,
        });
      } catch (notifErr) {
        console.error('[ScenarioFlowJobScheduler] Failed to send Google Space notification:', notifErr);
      }
    }

    // Compute next run date
    const nextRun = this.getNextRunDate(
      job.scheduleType,
      job.cronExpression,
      job.intervalSeconds,
      job.scheduledAt
    );

    const willComplete =
      (job.scheduleType === 'ONCE') ||
      (job.stopCondition === 'MAX_ITERATIONS' && job.maxIterations && newIterationCount >= job.maxIterations) ||
      (job.stopCondition === 'UNTIL_DATE' && job.endAt && nextRun && nextRun >= new Date(job.endAt));

    const finalStatus = willComplete ? 'COMPLETED' : job.status;
    if (willComplete) {
      this.stopJob(jobId);
    }

    await updateScenarioFlowJob(jobId, {
      status: finalStatus,
      lastRunAt: now,
      nextRunAt: willComplete ? null : nextRun,
      lastStatus: isSuccess ? 'SUCCESS' : 'FAILED',
      lastError: errorMessage,
      currentIteration: newIterationCount,
      dataSheetCurrentIndex: nextIndex,
      totalRuns: job.totalRuns + 1,
      successRuns: isSuccess ? job.successRuns + 1 : job.successRuns,
      failedRuns: !isSuccess ? job.failedRuns + 1 : job.failedRuns,
    });
  }

  public getActiveTaskCount(): number {
    return this.activeTasks.size;
  }
}

// Export singleton instance
export const flowJobScheduler = new ScenarioFlowJobScheduler();
