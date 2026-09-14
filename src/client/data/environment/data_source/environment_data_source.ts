import { Environment } from '@/src/client/domain/environment/entity/environment';

export interface EnvironmentRemoteDataSource {
  getByProjectId(projectId: string): Promise<Environment[]>;
  getById(id: string): Promise<Environment | null>;
  create(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment>;
  update(id: string, input: Partial<Environment>): Promise<Environment>;
  softDelete(id: string): Promise<void>;
}
