import { Environment } from '@/src/domain/environment/entity/environment';

export interface EnvironmentDataSource {
  getEnvironmentsByProjectId(projectId: string): Environment[];
  getEnvironmentById(id: string): Environment | null;
  createEnvironment(
    input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
  ): Environment;
  updateEnvironment(id: string, input: Partial<Environment>): Environment;
  softDeleteEnvironment(id: string): void;
  removeEnvironmentsByProjectId(projectId: string): void;
}
