import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { ApiEnvironment } from '@/src/client/domain/api/entity/api_environment';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { Collection } from '@/src/client/domain/collection/entity/collection';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { ScenarioFlow, ScenarioFlowStep, ScenarioFlowJob } from '@/src/client/domain/scenario-flow/entity/scenario_flow';

export interface ProjectPicEntity {
  id: string;
  projectId: string;
  accountId: string;
  createdAt: string;
}

export interface ApiPicEntity {
  id: string;
  apiId: string;
  accountId: string;
  createdAt: string;
}

export interface AiApiKeyEntity {
  id: string;
  name: string;
  provider: string;
  encryptedKey: string;
  keyHint: string;
  priority: number;
  isActive: boolean;
  lastUsedAt?: string | null;
  failureCount?: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountEntity {
  id: string;
  username: string;
  password?: string;
  role: string;
  name: string;
  googleId?: string | null;
  hasCustomPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockApiDatabase {
  version: string;
  projects: Project[];
  environments: Environment[];
  collections: Collection[];
  apiCollections: ApiCollection[];
  apiEnvironments: ApiEnvironment[];
  requestScenarios: RequestScenario[];
  responseScenarios: ResponseScenario[];
  dataSheets?: DataSheet[];
  scenarioFlows?: ScenarioFlow[];
  scenarioFlowSteps?: ScenarioFlowStep[];
  scenarioFlowJobs?: ScenarioFlowJob[];
  projectPics?: ProjectPicEntity[];
  apiPics?: ApiPicEntity[];
  aiApiKeys?: AiApiKeyEntity[];
  accounts?: AccountEntity[];
}

