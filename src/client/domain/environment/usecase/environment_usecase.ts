import { Environment } from '../entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';

export interface EnvironmentUseCase {
  load(projectId: string): Promise<{ project: Project | null; environments: Environment[] }>;
  create(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment>;
  update(id: string, input: Partial<Environment>): Promise<Environment>;
  softDelete(id: string): Promise<void>;
  toggleStatus(id: string): Promise<void>;
}

