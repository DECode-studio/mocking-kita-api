import { Project } from '../entity/project';
import { ProjectRepository } from '../repository/project_repository';

export interface ProjectUseCase {
  getAll(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  update(id: string, input: Partial<Project>): Promise<Project>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
  toggleStatus(id: string): Promise<void>;
  duplicate(id: string): Promise<Project | null>;
}

export class ProjectUseCaseImpl implements ProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  getAll(): Promise<Project[]> {
    return this.projectRepository.getAll();
  }

  getById(id: string): Promise<Project | null> {
    return this.projectRepository.getById(id);
  }

  create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return this.projectRepository.create(input);
  }

  update(id: string, input: Partial<Project>): Promise<Project> {
    return this.projectRepository.update(id, input);
  }

  softDelete(id: string): Promise<void> {
    return this.projectRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.projectRepository.restore(id);
  }

  hardDelete(id: string): Promise<void> {
    return this.projectRepository.hardDelete(id);
  }

  async toggleStatus(id: string): Promise<void> {
    const project = await this.projectRepository.getById(id);
    if (!project) return;
    await this.projectRepository.update(id, { status: !project.status });
  }

  async duplicate(id: string): Promise<Project | null> {
    const project = await this.projectRepository.getById(id);
    if (!project) return null;

    return this.projectRepository.create({
      name: `${project.name} (Copy)`,
      description: project.description,
      status: project.status,
    });
  }
}
