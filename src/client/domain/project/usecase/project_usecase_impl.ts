import { Project } from '../entity/project';
import { ProjectRepository } from '../repository/project_repository';
import { OpenApiSpec } from '@/src/core/openapi/openapi_converter';
import { ProjectUseCase } from './project_usecase';

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

  exportOpenApi(projectId: string): Promise<OpenApiSpec> {
    return this.projectRepository.exportOpenApi(projectId);
  }

  importOpenApi(
    projectId: string,
    openApiJson: unknown,
    mode: 'upsert' | 'merge' | 'replace' = 'upsert'
  ): Promise<{ success: boolean; importedApiCount: number; importedCollectionCount: number; updatedApiCount?: number }> {
    return this.projectRepository.importOpenApi(projectId, openApiJson, mode);
  }
}
