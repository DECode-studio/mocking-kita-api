import { Environment } from '../entity/environment';
import { EnvironmentRepository } from '../repository/environment_repository';
import { Project } from '@/src/domain/project/entity/project';
import { ProjectRepository } from '@/src/domain/project/repository/project_repository';

export interface EnvironmentUseCase {
  load(projectId: string): Promise<{ project: Project | null; environments: Environment[] }>;
  create(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment>;
  update(id: string, input: Partial<Environment>): Promise<Environment>;
  softDelete(id: string): Promise<void>;
  toggleStatus(id: string): Promise<void>;
}

export class EnvironmentUseCaseImpl implements EnvironmentUseCase {
  constructor(
    private readonly environmentRepository: EnvironmentRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

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
