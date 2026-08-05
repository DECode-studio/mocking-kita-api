import { Environment } from '@/src/domain/environment/entity/environment';
import { EnvironmentRepository } from '@/src/domain/environment/repository/environment_repository';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export class EnvironmentRemoteRepository implements EnvironmentRepository {
  async getByProjectId(projectId: string): Promise<Environment[]> {
    const database = await callDatabase<{ environments: Environment[] }>('getDatabase');
    return database.environments.filter((environment) => environment.projectId === projectId);
  }

  async getById(id: string): Promise<Environment | null> {
    const database = await callDatabase<{ environments: Environment[] }>('getDatabase');
    return database.environments.find((environment) => environment.id === id) || null;
  }

  async create(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment> {
    return callDatabase<Environment>('createEnvironment', input);
  }

  async update(id: string, input: Partial<Environment>): Promise<Environment> {
    return callDatabase<Environment>('updateEnvironment', { id, input });
  }

  async softDelete(id: string): Promise<void> {
    await callDatabase<void>('softDeleteEnvironment', { id });
  }
}
