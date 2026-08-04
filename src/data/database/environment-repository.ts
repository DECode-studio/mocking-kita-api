import { Environment } from '@/src/domain/environment/entity/environment';

export interface EnvironmentDatabaseRepository {
  createEnvironment(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment>;
  updateEnvironment(id: string, input: Partial<Environment>): Promise<Environment>;
  softDeleteEnvironment(id: string): Promise<void>;
  getByProjectId(projectId: string): Promise<Environment[]>;
  getEnvironmentById(id: string): Promise<Environment | null>;
}
