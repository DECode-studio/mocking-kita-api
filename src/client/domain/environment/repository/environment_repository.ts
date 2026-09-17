import { Environment } from '../entity/environment';

export interface EnvironmentRepository {
  getAll(): Promise<Environment[]>;
  getByProjectId(projectId: string): Promise<Environment[]>;
  getById(id: string): Promise<Environment | null>;
  create(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment>;
  update(id: string, input: Partial<Environment>): Promise<Environment>;
  softDelete(id: string): Promise<void>;
}
