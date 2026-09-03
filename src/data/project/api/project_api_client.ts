import { apiRequest } from '@/src/core/http-client/api-client';
import { Project } from '@/src/domain/project/entity/project';
import { OpenApiSpec } from '@/src/core/openapi/openapi_converter';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/data/common/remote-response';

export async function listProjects(): Promise<Project[]> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Project[]>>('/api/projects'));
}

export async function getProject(id: string): Promise<Project | null> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Project | null>>(`/api/projects/${encodeURIComponent(id)}`));
}

export async function createProjectRemote(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Project>>('/api/projects', { method: 'POST', body: input }));
}

export async function updateProjectRemote(id: string, input: Partial<Project>): Promise<Project> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Project>>(`/api/projects/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
}

export async function softDeleteProjectRemote(id: string): Promise<void> {
  unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}

export async function restoreProjectRemote(id: string): Promise<void> {
  unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/projects/${encodeURIComponent(id)}/restore`, { method: 'POST' }));
}

export async function hardDeleteProjectRemote(id: string): Promise<void> {
  unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/projects/${encodeURIComponent(id)}/hard`, { method: 'DELETE' }));
}

export async function exportProjectOpenApiRemote(projectId: string): Promise<OpenApiSpec> {
  return apiRequest<OpenApiSpec>(`/api/projects/${encodeURIComponent(projectId)}/export-openapi`);
}

export async function importProjectOpenApiRemote(
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
