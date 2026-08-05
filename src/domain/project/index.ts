import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import { ProjectUseCaseImpl } from './usecase/project_usecase';

export function createProjectUseCase() {
  return new ProjectUseCaseImpl(new ProjectRemoteRepository());
}
