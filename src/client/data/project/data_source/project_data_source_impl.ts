import { apiRequest } from '@/src/core/http-client/api-client';
import { Project } from '@/src/client/domain/project/entity/project';
import { OpenApiSpec } from '@/src/core/openapi/openapi_converter';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { ProjectRemoteDataSource } from './project_data_source';

export class ProjectRemoteDataSourceImpl implements ProjectRemoteDataSource {
  async getAll(): Promise<Project[]> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Project[]>>('/api/projects'));
  }

  async getById(id: string): Promise<Project | null> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Project | null>>(`/api/projects/${encodeURIComponent(id)}`));
  }

  async create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Project>>('/api/projects', { method: 'POST', body: input }));
  }

  async update(id: string, input: Partial<Project>): Promise<Project> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Project>>(`/api/projects/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
  }

  async softDelete(id: string): Promise<void> {
    unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  }

  async restore(id: string): Promise<void> {
    unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/projects/${encodeURIComponent(id)}/restore`, { method: 'POST' }));
  }

  async hardDelete(id: string): Promise<void> {
    unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/projects/${encodeURIComponent(id)}/hard`, { method: 'DELETE' }));
  }

  async exportOpenApi(projectId: string): Promise<OpenApiSpec> {
    return apiRequest<OpenApiSpec>(`/api/projects/${encodeURIComponent(projectId)}/export-openapi`);
  }

  async importOpenApi(
    projectId: string,
    openApiJson: unknown,
    mode: 'upsert' | 'merge' | 'replace' = 'upsert'
  ): Promise<{ success: boolean; importedApiCount: number; importedCollectionCount: number; updatedApiCount?: number }> {
    const response = await apiRequest<RemoteEnvelope<{ importedApiCount: number; importedCollectionCount: number; updatedApiCount?: number }>>(
      `/api/projects/${encodeURIComponent(projectId)}/import-openapi`,
      { method: 'POST', body: { openApiJson, mode } }
    );
    const data = unwrapRemoteData(response);
    return { success: true, ...data };
  }
}

// Standalone functions for backward compatibility / tests if needed
export const getAllProjects = () => new ProjectRemoteDataSourceImpl().getAll();
export const getProjectById = (id: string) => new ProjectRemoteDataSourceImpl().getById(id);
export const createProject = (input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => new ProjectRemoteDataSourceImpl().create(input);
export const updateProject = (id: string, input: Partial<Project>) => new ProjectRemoteDataSourceImpl().update(id, input);
export const softDeleteProject = (id: string) => new ProjectRemoteDataSourceImpl().softDelete(id);
export const restoreProject = (id: string) => new ProjectRemoteDataSourceImpl().restore(id);
export const hardDeleteProject = (id: string) => new ProjectRemoteDataSourceImpl().hardDelete(id);
