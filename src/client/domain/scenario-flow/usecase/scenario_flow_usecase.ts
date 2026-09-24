import {
  ScenarioFlow,
  ScenarioFlowStep,
  ScenarioFlowExecution,
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
    variables?: Record<string, any>;
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
      initialVariables?: Record<string, any>;
      executedBy?: string;
      stepId?: string | null;
    }
  ): Promise<{
    execution: ScenarioFlowExecution;
    steps: any[];
    finalVariables: Record<string, any>;
  }>;
  getExecutionDetail(executionId: string): Promise<ScenarioFlowExecution | null>;

  // Import / Export
  importTemplate(projectId: string, templateJson: any): Promise<ImportFlowResult>;
  exportTemplate(flowId: string): Promise<any>;
}
