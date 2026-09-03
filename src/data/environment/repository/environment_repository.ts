import { Environment } from '@/src/domain/environment/entity/environment';
import { EnvironmentRepository } from '@/src/domain/environment/repository/environment_repository';
import { createEnvironmentRemote, getEnvironment, listEnvironmentsByProject, softDeleteEnvironmentRemote, updateEnvironmentRemote } from '../api/environment_api_client';

export class EnvironmentRemoteRepository implements EnvironmentRepository {
  async getByProjectId(projectId: string): Promise<Environment[]> {
    return listEnvironmentsByProject(projectId);
  }

  async getById(id: string): Promise<Environment | null> {
    return getEnvironment(id);
  }

  async create(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment> {
    return createEnvironmentRemote(input);
  }

  async update(id: string, input: Partial<Environment>): Promise<Environment> {
    return updateEnvironmentRemote(id, input);
  }

  async softDelete(id: string): Promise<void> {
    await softDeleteEnvironmentRemote(id);
  }
}
