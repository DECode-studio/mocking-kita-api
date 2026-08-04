import { Project } from '@/src/domain/project/entity/project';

export interface ProjectDatabaseRepository {
  create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  update(id: string, input: Partial<Project>): Promise<Project>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
  getAll(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
}
