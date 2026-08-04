import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { Environment } from '@/src/domain/environment/entity/environment';
import { Project } from '@/src/domain/project/entity/project';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';

export interface MockApiDatabase {
  version: string;
  projects: Project[];
  environments: Environment[];
  apiCollections: ApiCollection[];
  apiEnvironments: ApiEnvironment[];
  requestScenarios: RequestScenario[];
  responseScenarios: ResponseScenario[];
}
