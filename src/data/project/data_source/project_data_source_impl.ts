import { Project } from '@/src/domain/project/entity/project';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export async function getAllProjects(): Promise<Project[]> {
  const database = await callDatabase<{ projects: Project[] }>('getDatabase');
  return database.projects;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find((project) => project.id === id) || null;
}

export async function createProject(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<Project> {
  return callDatabase<Project>('create', input);
}

export async function updateProject(id: string, input: Partial<Project>): Promise<Project> {
  return callDatabase<Project>('update', { id, input });
}

export async function softDeleteProject(id: string): Promise<void> {
  await callDatabase<void>('softDelete', { id });
}

export async function restoreProject(id: string): Promise<void> {
  await callDatabase<void>('restore', { id });
}

export async function hardDeleteProject(id: string): Promise<void> {
  await callDatabase<void>('hardDelete', { id });
}
