import {
  ScenarioFlow,
  ScenarioFlowStep,
  ScenarioFlowExecution,
  ScenarioFlowExecutionStep,
  ScenarioFlowJob,
  FlowExportTemplate,
  GetJobExecutionsFilter,
  JobExecutionsResult,
} from '../entity/scenario_flow';
import {
  ScenarioFlowRepository,
  ImportFlowResult,
} from '../repository/scenario_flow_repository';
import { ScenarioFlowUseCase } from './scenario_flow_usecase';

export class ScenarioFlowUseCaseImpl implements ScenarioFlowUseCase {
  constructor(private readonly repository: ScenarioFlowRepository) {}

  async getAll(projectId?: string): Promise<ScenarioFlow[]> {
    const flows = await this.repository.getAll(projectId);
    return flows.filter((f) => !f.deletedAt);
  }

  async getByProjectId(projectId: string): Promise<ScenarioFlow[]> {
    const flows = await this.repository.getByProjectId(projectId);
    return flows.filter((f) => !f.deletedAt);
  }

  async getById(id: string): Promise<ScenarioFlow | null> {
    return this.repository.getById(id);
  }

  async create(input: {
    projectId?: string | null;
    name: string;
    description?: string | null;
    defaultEnvironmentId?: string | null;
    stopOnFailure?: boolean;
    variables?: Record<string, unknown>;
  }): Promise<ScenarioFlow> {
    return this.repository.create(input);
  }

  async update(id: string, input: Partial<ScenarioFlow>): Promise<ScenarioFlow> {
    return this.repository.update(id, input);
  }

  async softDelete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  async toggleStatus(id: string): Promise<void> {
    const flow = await this.repository.getById(id);
    if (!flow) return;
    await this.repository.update(id, { status: !flow.status });
  }

  async addStep(
    flowId: string,
    input: Partial<ScenarioFlowStep> & { name: string; stepOrder: number }
  ): Promise<ScenarioFlowStep> {
    return this.repository.addStep(flowId, input);
  }

  async updateStep(
    flowId: string,
    stepId: string,
    input: Partial<ScenarioFlowStep>
  ): Promise<ScenarioFlowStep> {
    return this.repository.updateStep(flowId, stepId, input);
  }

  async deleteStep(flowId: string, stepId: string): Promise<void> {
    return this.repository.deleteStep(flowId, stepId);
  }

  async reorderSteps(flowId: string, stepIds: string[]): Promise<void> {
    return this.repository.reorderSteps(flowId, stepIds);
  }

  async runFlow(
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
  }> {
    return this.repository.runFlow(flowId, options);
  }

  async getExecutionDetail(executionId: string): Promise<ScenarioFlowExecution | null> {
    return this.repository.getExecutionDetail(executionId);
  }

  async importTemplate(
    projectId: string,
    templateJson: FlowExportTemplate | Record<string, unknown>
  ): Promise<ImportFlowResult> {
    return this.repository.importTemplate(projectId, templateJson);
  }

  async exportTemplate(flowId: string): Promise<FlowExportTemplate> {
    return this.repository.exportTemplate(flowId);
  }

  async getJobs(flowId?: string, projectId?: string): Promise<ScenarioFlowJob[]> {
    return this.repository.getJobs(flowId, projectId);
  }

  async getJobById(jobId: string): Promise<ScenarioFlowJob | null> {
    return this.repository.getJobById(jobId);
  }

  async createJob(input: Partial<ScenarioFlowJob> & { flowId: string; name: string }): Promise<ScenarioFlowJob> {
    return this.repository.createJob(input);
  }

  async updateJob(jobId: string, input: Partial<ScenarioFlowJob>): Promise<ScenarioFlowJob> {
    return this.repository.updateJob(jobId, input);
  }

  async deleteJob(jobId: string): Promise<void> {
    return this.repository.deleteJob(jobId);
  }

  async toggleJobStatus(jobId: string): Promise<ScenarioFlowJob> {
    return this.repository.toggleJobStatus(jobId);
  }

  async runNowJob(jobId: string): Promise<ScenarioFlowJob> {
    return this.repository.runNowJob(jobId);
  }

  async getJobExecutions(params?: GetJobExecutionsFilter): Promise<JobExecutionsResult> {
    return this.repository.getJobExecutions(params);
  }
}

