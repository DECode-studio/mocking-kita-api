import { Project } from '@/src/domain/project/entity/project';

export interface ProjectDataSource {
  getAllProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  createProject(
    input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
  ): Promise<Project>;
  updateProject(id: string, input: Partial<Project>): Promise<Project>;
  softDeleteProject(id: string): Promise<void>;
  restoreProject(id: string): Promise<void>;
  hardDeleteProject(id: string): Promise<void>;
}
