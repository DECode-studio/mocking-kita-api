import {
  ScenarioFlow,
  ScenarioFlowStep,
  ScenarioFlowExecution,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import {
  ScenarioFlowRepository,
  ImportFlowResult,
} from '@/src/client/domain/scenario-flow/repository/scenario_flow_repository';
import { ScenarioFlowRemoteDataSource } from '../data_source/scenario_flow_data_source';
import { ScenarioFlowRemoteDataSourceImpl } from '../data_source/scenario_flow_data_source_impl';

export class ScenarioFlowRepositoryImpl implements ScenarioFlowRepository {
  constructor(
    private readonly dataSource: ScenarioFlowRemoteDataSource = new ScenarioFlowRemoteDataSourceImpl()
  ) {}

  async getAll(projectId?: string): Promise<ScenarioFlow[]> {
    return this.dataSource.getAll(projectId);
  }

  async getByProjectId(projectId: string): Promise<ScenarioFlow[]> {
    return this.dataSource.getByProjectId(projectId);
  }

  async getById(id: string): Promise<ScenarioFlow | null> {
    return this.dataSource.getById(id);
  }

  async create(input: Partial<ScenarioFlow> & { name: string; projectId?: string | null }): Promise<ScenarioFlow> {
    return this.dataSource.create(input);
  }

  async update(id: string, input: Partial<ScenarioFlow>): Promise<ScenarioFlow> {
    return this.dataSource.update(id, input);
  }

  async softDelete(id: string): Promise<void> {
    return this.dataSource.softDelete(id);
  }

  async addStep(
    flowId: string,
    input: Partial<ScenarioFlowStep> & { name: string; stepOrder: number }
  ): Promise<ScenarioFlowStep> {
    return this.dataSource.addStep(flowId, input);
  }

  async updateStep(
    flowId: string,
    stepId: string,
    input: Partial<ScenarioFlowStep>
  ): Promise<ScenarioFlowStep> {
    return this.dataSource.updateStep(flowId, stepId, input);
  }

  async deleteStep(flowId: string, stepId: string): Promise<void> {
    return this.dataSource.deleteStep(flowId, stepId);
  }

  async reorderSteps(flowId: string, stepIds: string[]): Promise<void> {
    return this.dataSource.reorderSteps(flowId, stepIds);
  }

  async runFlow(
    flowId: string,
    options?: {
      environmentId?: string | null;
      environmentType?: string | null;
      targetMode?: 'LIVE' | 'MOCK';
      initialVariables?: Record<string, any>;
      executedBy?: string;
    }
  ): Promise<{
    execution: ScenarioFlowExecution;
    steps: any[];
    finalVariables: Record<string, any>;
  }> {
    return this.dataSource.runFlow(flowId, options);
  }

  async getExecutionDetail(executionId: string): Promise<ScenarioFlowExecution | null> {
    return this.dataSource.getExecutionDetail(executionId);
  }

  async importTemplate(projectId: string, templateJson: any): Promise<ImportFlowResult> {
    return this.dataSource.importTemplate(projectId, templateJson);
  }

  async exportTemplate(flowId: string): Promise<any> {
    return this.dataSource.exportTemplate(flowId);
  }
}
