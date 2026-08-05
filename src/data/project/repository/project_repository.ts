import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { Project } from '@/src/domain/project/entity/project';
import { ProjectRepository } from '@/src/domain/project/repository/project_repository';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export class ProjectRemoteRepository implements ProjectRepository {
  async getAll(): Promise<Project[]> {
    const database = await this.getDatabase();
    return database.projects;
  }

  async getById(id: string): Promise<Project | null> {
    const database = await this.getDatabase();
    return database.projects.find((project) => project.id === id) || null;
  }

  async create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return callDatabase<Project>('create', input);
  }

  async update(id: string, input: Partial<Project>): Promise<Project> {
    return callDatabase<Project>('update', { id, input });
  }

  async softDelete(id: string): Promise<void> {
    await callDatabase<void>('softDelete', { id });
  }

  async restore(id: string): Promise<void> {
    await callDatabase<void>('restore', { id });
  }

  async hardDelete(id: string): Promise<void> {
    await callDatabase<void>('hardDelete', { id });
  }

  async getDatabase(): Promise<MockApiDatabase> {
    return callDatabase<MockApiDatabase>('getDatabase');
  }
}
