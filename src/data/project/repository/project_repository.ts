import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';
import { Project } from '@/src/domain/project/entity/project';
import { ProjectRepository } from '@/src/domain/project/repository/project_repository';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';
import { OpenApiSpec } from '@/src/core/openapi/openapi_converter';

export class ProjectRemoteRepository implements ProjectRepository {
  async getAll(): Promise<Project[]> {
    const database = await this.getDatabase();
    return database.projects;
  }

  async getById(id: string): Promise<Project | null> {
    const database = await this.getDatabase();
    return database.projects.find((project) => project.id === id) || null;
  }

  async create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return callDatabase<Project>('create', input);
  }

  async update(id: string, input: Partial<Project>): Promise<Project> {
    return callDatabase<Project>('update', { id, input });
  }

  async softDelete(id: string): Promise<void> {
    await callDatabase<void>('softDelete', { id });
  }

  async restore(id: string): Promise<void> {
    await callDatabase<void>('restore', { id });
  }

  async hardDelete(id: string): Promise<void> {
    await callDatabase<void>('hardDelete', { id });
  }

  async exportOpenApi(projectId: string): Promise<OpenApiSpec> {
    return callDatabase<OpenApiSpec>('exportProjectOpenApi', { projectId });
  }

  async importOpenApi(
    projectId: string,
    openApiJson: unknown,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<{ success: boolean; importedApiCount: number; importedCollectionCount: number }> {
    return callDatabase<{ success: boolean; importedApiCount: number; importedCollectionCount: number }>(
      'importProjectOpenApi',
      { projectId, openApiJson, mode }
    );
  }

  async getDatabase(): Promise<MockApiDatabase> {
    return callDatabase<MockApiDatabase>('getDatabase');
  }
}
