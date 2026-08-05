import { EnvironmentRemoteRepository } from './repository/environment_repository';
import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import { EnvironmentUseCaseImpl } from '@/src/domain/environment/usecase/environment_usecase';

export const environmentUseCase = new EnvironmentUseCaseImpl(
  new EnvironmentRemoteRepository(),
  new ProjectRemoteRepository()
);
