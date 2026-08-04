import { Project } from '@/src/domain/project/entity/project';

export interface ProjectDataSource {
  getAllProjects(): Project[];
  getProjectById(id: string): Project | null;
  createProject(
    input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
  ): Project;
  updateProject(id: string, input: Partial<Project>): Project;
  softDeleteProject(id: string): void;
  restoreProject(id: string): void;
  hardDeleteProject(id: string): void;
}
