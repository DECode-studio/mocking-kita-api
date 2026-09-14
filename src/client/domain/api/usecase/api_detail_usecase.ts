import { ApiCollection } from '../entity/api_collection';
import { Project } from '@/src/client/domain/project/entity/project';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';

export interface ApiDetailSnapshot {
  project: Project | null;
  api: ApiCollection | null;
  requestScenarios: RequestScenario[];
  responseScenarios: ResponseScenario[];
  activeResponseScenarios: ResponseScenario[];
  activeReqScenario: RequestScenario | null;
}

type CreateRequestScenarioInput = Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>;
type CreateResponseScenarioInput = Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>;

export interface ApiDetailUseCase {
  load(projectId: string, apiId: string, selectedReqScenarioId?: string | null): Promise<ApiDetailSnapshot>;
  toggleApiStatus(apiId: string): Promise<void>;
  createRequestScenario(input: CreateRequestScenarioInput): Promise<RequestScenario>;
  updateRequestScenario(id: string, input: Partial<RequestScenario>): Promise<RequestScenario>;
  createResponseScenario(input: CreateResponseScenarioInput): Promise<ResponseScenario>;
  updateResponseScenario(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario>;
  toggleRequestScenarioStatus(id: string): Promise<void>;
  duplicateRequestScenario(id: string): Promise<RequestScenario | null>;
  deleteRequestScenario(id: string): Promise<void>;
  toggleResponseScenarioStatus(id: string): Promise<void>;
  duplicateResponseScenario(id: string): Promise<ResponseScenario | null>;
  deleteResponseScenario(id: string): Promise<void>;
  uploadResponseFile(file: File): Promise<{ filePath: string; fileName: string }>;
}
