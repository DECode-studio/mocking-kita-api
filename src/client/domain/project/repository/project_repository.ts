import { Project } from '../entity/project';
import { OpenApiSpec } from '@/src/core/openapi/openapi_converter';

export interface ProjectRepository {
  getAll(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  update(id: string, input: Partial<Project>): Promise<Project>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
  exportOpenApi(projectId: string): Promise<OpenApiSpec>;
  importOpenApi(
    projectId: string,
    openApiJson: unknown,
    mode?: 'upsert' | 'merge' | 'replace'
  ): Promise<{ success: boolean; importedApiCount: number; importedCollectionCount: number; updatedApiCount?: number }>;
}
