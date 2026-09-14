import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { ApiEnvironment } from '@/src/client/domain/api/entity/api_environment';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { Collection } from '@/src/client/domain/collection/entity/collection';

export interface MockApiDatabase {
  version: string;
  projects: Project[];
  environments: Environment[];
  collections: Collection[];
  apiCollections: ApiCollection[];
  apiEnvironments: ApiEnvironment[];
  requestScenarios: RequestScenario[];
  responseScenarios: ResponseScenario[];
}
