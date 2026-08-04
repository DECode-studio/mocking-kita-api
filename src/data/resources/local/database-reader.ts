import { db } from '@/src/core/db/sqlite-client';
import { MockApiDatabase } from '@/src/data/database/mock-api-database';
import { ApiRow, apiFromRow } from '@/src/data/api/model/api_collection_model';
import { ApiEnvironmentRow, apiEnvironmentFromRow } from '@/src/data/api/model/api_environment_model';
import { EnvironmentRow, environmentFromRow } from '@/src/data/environment/model/environment_model';
import { ProjectRow, projectFromRow } from '@/src/data/project/model/project_model';
import { RequestScenarioRow, requestScenarioFromRow } from '@/src/data/request-scenario/model/request_scenario_model';
import {
  ResponseScenarioRow,
  responseScenarioFromRow,
} from '@/src/data/response-scenario/model/response_scenario_model';
import { DEFAULT_VERSION } from './database-constants';

export function readDatabase(): MockApiDatabase {
  const projects = db.prepare('SELECT * FROM tblProject ORDER BY created_at ASC, id ASC').all() as ProjectRow[];
  const environments = db
    .prepare('SELECT * FROM tblEnvironment ORDER BY created_at ASC, id ASC')
    .all() as EnvironmentRow[];
  const apiCollections = db.prepare('SELECT * FROM tblApi ORDER BY created_at ASC, id ASC').all() as ApiRow[];
  const apiEnvironments = db
    .prepare('SELECT * FROM tblApiEnvironment ORDER BY created_at ASC, id ASC')
    .all() as ApiEnvironmentRow[];
  const requestScenarios = db
    .prepare('SELECT * FROM tblRequestScenario ORDER BY priority DESC, created_at ASC, id ASC')
    .all() as RequestScenarioRow[];
  const responseScenarios = db
    .prepare('SELECT * FROM tblResponseScenario ORDER BY priority DESC, created_at ASC, id ASC')
    .all() as ResponseScenarioRow[];

  return {
    version: DEFAULT_VERSION,
    projects: projects.map(projectFromRow),
    environments: environments.map(environmentFromRow),
    apiCollections: apiCollections.map(apiFromRow),
    apiEnvironments: apiEnvironments.map(apiEnvironmentFromRow),
    requestScenarios: requestScenarios.map(requestScenarioFromRow),
    responseScenarios: responseScenarios.map(responseScenarioFromRow),
  };
}
