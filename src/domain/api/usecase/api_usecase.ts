import { ApiCollection } from '../entity/api_collection';
import { ApiCollectionRepository } from '../repository/api_repository';
import { Project } from '@/src/domain/project/entity/project';
import { ProjectRepository } from '@/src/domain/project/repository/project_repository';

export interface ApiUseCase {
  load(projectId: string): Promise<{ project: Project | null; apis: ApiCollection[] }>;
  create(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection>;
  update(id: string, input: Partial<ApiCollection>): Promise<ApiCollection>;
  softDelete(id: string): Promise<void>;
  toggleStatus(id: string): Promise<void>;
  duplicate(id: string): Promise<ApiCollection | null>;
}

export class ApiUseCaseImpl implements ApiUseCase {
  constructor(
    private readonly apiRepository: ApiCollectionRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async load(projectId: string): Promise<{ project: Project | null; apis: ApiCollection[] }> {
    const [project, apis] = await Promise.all([
      this.projectRepository.getById(projectId),
      this.apiRepository.getByProjectId(projectId),
    ]);

    return {
      project,
      apis: apis.filter((api) => !api.deletedAt),
    };
  }

  create(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection> {
    return this.apiRepository.create(input);
  }

  update(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
    return this.apiRepository.update(id, input);
  }

  softDelete(id: string): Promise<void> {
    return this.apiRepository.softDelete(id);
  }

  async toggleStatus(id: string): Promise<void> {
    const api = await this.apiRepository.getById(id);
    if (!api) return;
    await this.apiRepository.update(id, { status: !api.status });
  }

  async duplicate(id: string): Promise<ApiCollection | null> {
    const api = await this.apiRepository.getById(id);
    if (!api) return null;

    return this.apiRepository.create({
      projectId: api.projectId,
      name: `${api.name} (Copy)`,
      description: api.description,
      path: `${api.path}-copy`,
      methodRequest: api.methodRequest,
      status: api.status,
    });
  }
}
