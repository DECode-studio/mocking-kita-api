import {
  ScenarioFlow,
  ScenarioFlowStep,
  ScenarioFlowExecution,
  ScenarioFlowExecutionStep,
  ScenarioFlowJob,
  FlowExportTemplate,
} from '../entity/scenario_flow';
import { ImportFlowResult } from '../repository/scenario_flow_repository';

export interface ScenarioFlowUseCase {
  getAll(projectId?: string): Promise<ScenarioFlow[]>;
  getByProjectId(projectId: string): Promise<ScenarioFlow[]>;
  getById(id: string): Promise<ScenarioFlow | null>;
  create(input: {
    projectId?: string | null;
    name: string;
    description?: string | null;
    defaultEnvironmentId?: string | null;
    stopOnFailure?: boolean;
    variables?: Record<string, unknown>;
  }): Promise<ScenarioFlow>;
  update(id: string, input: Partial<ScenarioFlow>): Promise<ScenarioFlow>;
  softDelete(id: string): Promise<void>;
  toggleStatus(id: string): Promise<void>;

  // Steps
  addStep(flowId: string, input: Partial<ScenarioFlowStep> & { name: string; stepOrder: number }): Promise<ScenarioFlowStep>;
  updateStep(flowId: string, stepId: string, input: Partial<ScenarioFlowStep>): Promise<ScenarioFlowStep>;
  deleteStep(flowId: string, stepId: string): Promise<void>;
  reorderSteps(flowId: string, stepIds: string[]): Promise<void>;

  // Real Testing Runner
  runFlow(
    flowId: string,
    options?: {
      environmentId?: string | null;
      environmentType?: string | null;
      targetMode?: 'LIVE' | 'MOCK';
      initialVariables?: Record<string, unknown>;
      executedBy?: string;
      stepId?: string | null;
    }
  ): Promise<{
    execution: ScenarioFlowExecution;
    steps: ScenarioFlowExecutionStep[];
    finalVariables: Record<string, unknown>;
  }>;
  getExecutionDetail(executionId: string): Promise<ScenarioFlowExecution | null>;

  // Import / Export
  importTemplate(projectId: string, templateJson: FlowExportTemplate | Record<string, unknown>): Promise<ImportFlowResult>;
  exportTemplate(flowId: string): Promise<FlowExportTemplate>;

  // Scheduled Jobs
  getJobs(flowId?: string, projectId?: string): Promise<ScenarioFlowJob[]>;
  getJobById(jobId: string): Promise<ScenarioFlowJob | null>;
  createJob(input: Partial<ScenarioFlowJob> & { flowId: string; name: string }): Promise<ScenarioFlowJob>;
  updateJob(jobId: string, input: Partial<ScenarioFlowJob>): Promise<ScenarioFlowJob>;
  deleteJob(jobId: string): Promise<void>;
  toggleJobStatus(jobId: string): Promise<ScenarioFlowJob>;
  runNowJob(jobId: string): Promise<ScenarioFlowJob>;
  getJobExecutions(params?: import('../entity/scenario_flow').GetJobExecutionsFilter): Promise<import('../entity/scenario_flow').JobExecutionsResult>;
}

