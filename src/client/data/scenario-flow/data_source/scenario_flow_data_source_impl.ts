import { apiRequest } from '@/src/core/http-client/api-client';
import {
  ScenarioFlow,
  ScenarioFlowStep,
  ScenarioFlowExecution,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { ScenarioFlowRemoteDataSource } from './scenario_flow_data_source';
import { ImportFlowResult } from '@/src/client/domain/scenario-flow/repository/scenario_flow_repository';

export class ScenarioFlowRemoteDataSourceImpl implements ScenarioFlowRemoteDataSource {
  async getAll(projectId?: string): Promise<ScenarioFlow[]> {
    const url = projectId
      ? `/api/scenario-flows?projectId=${encodeURIComponent(projectId)}`
      : '/api/scenario-flows';
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<ScenarioFlow[]>>(url));
  }

  async getByProjectId(projectId: string): Promise<ScenarioFlow[]> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ScenarioFlow[]>>(
        `/api/projects/${encodeURIComponent(projectId)}/scenario-flows`
      )
    );
  }

  async getById(id: string): Promise<ScenarioFlow | null> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ScenarioFlow | null>>(
        `/api/scenario-flows/${encodeURIComponent(id)}`
      )
    );
  }

  async create(input: Partial<ScenarioFlow> & { name: string; projectId?: string | null }): Promise<ScenarioFlow> {
    const url = input.projectId
      ? `/api/projects/${encodeURIComponent(input.projectId)}/scenario-flows`
      : '/api/scenario-flows';
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ScenarioFlow>>(url, { method: 'POST', body: input })
    );
  }

  async update(id: string, input: Partial<ScenarioFlow>): Promise<ScenarioFlow> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ScenarioFlow>>(
        `/api/scenario-flows/${encodeURIComponent(id)}`,
        { method: 'PUT', body: input }
      )
    );
  }

  async softDelete(id: string): Promise<void> {
    unwrapRemoteData(
      await apiRequest<RemoteEnvelope<void>>(
        `/api/scenario-flows/${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      )
    );
  }

  async addStep(
    flowId: string,
    input: Partial<ScenarioFlowStep> & { name: string; stepOrder: number }
  ): Promise<ScenarioFlowStep> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ScenarioFlowStep>>(
        `/api/scenario-flows/${encodeURIComponent(flowId)}/steps`,
        { method: 'POST', body: input }
      )
    );
  }

  async updateStep(
    flowId: string,
    stepId: string,
    input: Partial<ScenarioFlowStep>
  ): Promise<ScenarioFlowStep> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ScenarioFlowStep>>(
        `/api/scenario-flows/${encodeURIComponent(flowId)}/steps/${encodeURIComponent(stepId)}`,
        { method: 'PUT', body: input }
      )
    );
  }

  async deleteStep(flowId: string, stepId: string): Promise<void> {
    unwrapRemoteData(
      await apiRequest<RemoteEnvelope<void>>(
        `/api/scenario-flows/${encodeURIComponent(flowId)}/steps/${encodeURIComponent(stepId)}`,
        { method: 'DELETE' }
      )
    );
  }

  async reorderSteps(flowId: string, stepIds: string[]): Promise<void> {
    unwrapRemoteData(
      await apiRequest<RemoteEnvelope<void>>(
        `/api/scenario-flows/${encodeURIComponent(flowId)}/steps/reorder`,
        { method: 'PUT', body: { stepIds } }
      )
    );
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
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<any>>(
        `/api/scenario-flows/${encodeURIComponent(flowId)}/run`,
        { method: 'POST', body: options || {} }
      )
    );
  }

  async getExecutionDetail(executionId: string): Promise<ScenarioFlowExecution | null> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ScenarioFlowExecution | null>>(
        `/api/scenario-flows/executions/${encodeURIComponent(executionId)}`
      )
    );
  }

  async importTemplate(projectId: string, templateJson: any): Promise<ImportFlowResult> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ImportFlowResult>>(
        `/api/projects/${encodeURIComponent(projectId)}/scenario-flows/import`,
        { method: 'POST', body: templateJson }
      )
    );
  }

  async exportTemplate(flowId: string): Promise<any> {
    const res = await fetch(`/api/scenario-flows/${encodeURIComponent(flowId)}/export`);
    if (!res.ok) {
      throw new Error(`Failed to export scenario flow: ${res.statusText}`);
    }
    return res.json();
  }
}
