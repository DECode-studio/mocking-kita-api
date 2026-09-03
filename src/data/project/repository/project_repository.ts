import { Project } from '@/src/domain/project/entity/project';
import { ProjectRepository } from '@/src/domain/project/repository/project_repository';
import { OpenApiSpec } from '@/src/core/openapi/openapi_converter';
import {
  createProjectRemote,
  exportProjectOpenApiRemote,
  getProject,
  hardDeleteProjectRemote,
  importProjectOpenApiRemote,
  listProjects,
  restoreProjectRemote,
  softDeleteProjectRemote,
  updateProjectRemote,
} from '../api/project_api_client';

export class ProjectRemoteRepository implements ProjectRepository {
  async getAll(): Promise<Project[]> {
    return listProjects();
  }

  async getById(id: string): Promise<Project | null> {
    return getProject(id);
  }

  async create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return createProjectRemote(input);
  }

  async update(id: string, input: Partial<Project>): Promise<Project> {
    return updateProjectRemote(id, input);
  }

  async softDelete(id: string): Promise<void> {
    await softDeleteProjectRemote(id);
  }

  async restore(id: string): Promise<void> {
    await restoreProjectRemote(id);
  }

  async hardDelete(id: string): Promise<void> {
    await hardDeleteProjectRemote(id);
  }

  async exportOpenApi(projectId: string): Promise<OpenApiSpec> {
    return exportProjectOpenApiRemote(projectId);
  }

  async importOpenApi(
    projectId: string,
    openApiJson: unknown,
    mode: 'upsert' | 'merge' | 'replace' = 'upsert'
  ): Promise<{ success: boolean; importedApiCount: number; importedCollectionCount: number; updatedApiCount?: number }> {
    return importProjectOpenApiRemote(projectId, openApiJson, mode);
  }
}
