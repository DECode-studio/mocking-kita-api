import { EnvironmentRemoteRepository } from '@/src/data/environment/repository/environment_repository';
import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import { EnvironmentUseCaseImpl } from './usecase/environment_usecase';

export function createEnvironmentUseCase() {
  return new EnvironmentUseCaseImpl(new EnvironmentRemoteRepository(), new ProjectRemoteRepository());
}
