import { Project } from '@/src/domain/project/entity/project';
import { createProjectRemote, getProject, hardDeleteProjectRemote, listProjects, restoreProjectRemote, softDeleteProjectRemote, updateProjectRemote } from '../api/project_api_client';

export async function getAllProjects(): Promise<Project[]> {
  return listProjects();
}

export async function getProjectById(id: string): Promise<Project | null> {
  return getProject(id);
}

export async function createProject(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<Project> {
  return createProjectRemote(input);
}

export async function updateProject(id: string, input: Partial<Project>): Promise<Project> {
  return updateProjectRemote(id, input);
}

export async function softDeleteProject(id: string): Promise<void> {
  await softDeleteProjectRemote(id);
}

export async function restoreProject(id: string): Promise<void> {
  await restoreProjectRemote(id);
}

export async function hardDeleteProject(id: string): Promise<void> {
  await hardDeleteProjectRemote(id);
}
