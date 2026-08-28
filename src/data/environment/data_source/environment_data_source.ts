import { Environment } from '@/src/domain/environment/entity/environment';

export interface EnvironmentDataSource {
  getEnvironmentsByProjectId(projectId: string): Promise<Environment[]>;
  getEnvironmentById(id: string): Promise<Environment | null>;
  createEnvironment(
    input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
  ): Promise<Environment>;
  updateEnvironment(id: string, input: Partial<Environment>): Promise<Environment>;
  softDeleteEnvironment(id: string): Promise<void>;
  removeEnvironmentsByProjectId(projectId: string): Promise<void>;
}
