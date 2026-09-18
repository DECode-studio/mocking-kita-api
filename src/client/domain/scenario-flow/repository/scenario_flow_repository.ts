import {
  ScenarioFlow,
  ScenarioFlowStep,
  ScenarioFlowExecution,
} from '../entity/scenario_flow';

export interface ImportFlowResult {
  success: boolean;
  flowId: string;
  flowName: string;
  apisCreated: number;
  apisExisting: number;
  requestScenariosCreated: number;
  stepsCount: number;
}

export interface ScenarioFlowRepository {
  getAll(projectId?: string): Promise<ScenarioFlow[]>;
  getByProjectId(projectId: string): Promise<ScenarioFlow[]>;
  getById(id: string): Promise<ScenarioFlow | null>;
  create(input: Partial<ScenarioFlow> & { name: string; projectId?: string | null }): Promise<ScenarioFlow>;
  update(id: string, input: Partial<ScenarioFlow>): Promise<ScenarioFlow>;
  softDelete(id: string): Promise<void>;
  
  // Steps
  addStep(flowId: string, input: Partial<ScenarioFlowStep> & { name: string; stepOrder: number }): Promise<ScenarioFlowStep>;
  updateStep(flowId: string, stepId: string, input: Partial<ScenarioFlowStep>): Promise<ScenarioFlowStep>;
  deleteStep(flowId: string, stepId: string): Promise<void>;
  reorderSteps(flowId: string, stepIds: string[]): Promise<void>;

  // Execution & Testing
  runFlow(
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
  }>;
  getExecutionDetail(executionId: string): Promise<ScenarioFlowExecution | null>;

  // Import / Export
  importTemplate(projectId: string, templateJson: any): Promise<ImportFlowResult>;
  exportTemplate(flowId: string): Promise<any>;
}
