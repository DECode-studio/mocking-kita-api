import { ApiDatabaseRepository } from './api-repository';
import { ApiEnvironmentDatabaseRepository } from './api-environment-repository';
import { EnvironmentDatabaseRepository } from './environment-repository';
import { MockApiDatabase } from './mock-api-database';
import { ProjectDatabaseRepository } from './project-repository';
import { RequestScenarioDatabaseRepository } from './request-scenario-repository';
import { ResponseScenarioDatabaseRepository } from './response-scenario-repository';

export interface DatabaseRepository
  extends ProjectDatabaseRepository,
    EnvironmentDatabaseRepository,
    ApiDatabaseRepository,
    ApiEnvironmentDatabaseRepository,
    RequestScenarioDatabaseRepository,
    ResponseScenarioDatabaseRepository {
  getDatabase(): Promise<MockApiDatabase>;
  saveDatabase(data: MockApiDatabase): Promise<void>;
  resetDatabase(): Promise<MockApiDatabase>;
  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
}
