import { Environment } from '../entity/environment';
import { EnvironmentRepository } from '../repository/environment_repository';
import { Project } from '@/src/client/domain/project/entity/project';
import { ProjectRepository } from '@/src/client/domain/project/repository/project_repository';
import { EnvironmentUseCase } from './environment_usecase';

export class EnvironmentUseCaseImpl implements EnvironmentUseCase {
  constructor(
    private readonly environmentRepository: EnvironmentRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async getAll(): Promise<Environment[]> {
    const environments = await this.environmentRepository.getAll();
    return environments.filter((env) => !env.deletedAt);
  }

  async getByProjectId(projectId: string): Promise<Environment[]> {
    const environments = await this.environmentRepository.getByProjectId(projectId);
    return environments.filter((env) => !env.deletedAt);
  }

  delete(id: string): Promise<void> {
    return this.softDelete(id);
  }

  async load(projectId: string): Promise<{ project: Project | null; environments: Environment[] }> {
    const [project, environments] = await Promise.all([
      this.projectRepository.getById(projectId),
      this.environmentRepository.getByProjectId(projectId),
    ]);

    return {
      project,
      environments: environments.filter((environment) => !environment.deletedAt),
    };
  }

  create(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment> {
    return this.environmentRepository.create(input);
  }

  update(id: string, input: Partial<Environment>): Promise<Environment> {
    return this.environmentRepository.update(id, input);
  }

  softDelete(id: string): Promise<void> {
    return this.environmentRepository.softDelete(id);
  }

  async toggleStatus(id: string): Promise<void> {
    const env = await this.environmentRepository.getById(id);
    if (!env) return;
    await this.environmentRepository.update(id, { status: !env.status });
  }
}
