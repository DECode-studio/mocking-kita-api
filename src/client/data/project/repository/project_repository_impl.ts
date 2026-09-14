import { Project } from '@/src/client/domain/project/entity/project';
import { ProjectRepository } from '@/src/client/domain/project/repository/project_repository';
import { OpenApiSpec } from '@/src/core/openapi/openapi_converter';
import { ProjectRemoteDataSource } from '../data_source/project_data_source';
import { ProjectRemoteDataSourceImpl } from '../data_source/project_data_source_impl';

export class ProjectRepositoryImpl implements ProjectRepository {
  constructor(private dataSource: ProjectRemoteDataSource = new ProjectRemoteDataSourceImpl()) {}

  async getAll(): Promise<Project[]> {
    return this.dataSource.getAll();
  }

  async getById(id: string): Promise<Project | null> {
    return this.dataSource.getById(id);
  }

  async create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return this.dataSource.create(input);
  }

  async update(id: string, input: Partial<Project>): Promise<Project> {
    return this.dataSource.update(id, input);
  }

  async softDelete(id: string): Promise<void> {
    return this.dataSource.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    return this.dataSource.restore(id);
  }

  async hardDelete(id: string): Promise<void> {
    return this.dataSource.hardDelete(id);
  }

  async exportOpenApi(projectId: string): Promise<OpenApiSpec> {
    return this.dataSource.exportOpenApi(projectId);
  }

  async importOpenApi(
    projectId: string,
    openApiJson: unknown,
    mode: 'upsert' | 'merge' | 'replace' = 'upsert'
  ): Promise<{ success: boolean; importedApiCount: number; importedCollectionCount: number; updatedApiCount?: number }> {
    return this.dataSource.importOpenApi(projectId, openApiJson, mode);
  }
}
