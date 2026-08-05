import { ProjectRemoteRepository } from './repository/project_repository';
import { ProjectUseCaseImpl } from '@/src/domain/project/usecase/project_usecase';

export const projectUseCase = new ProjectUseCaseImpl(new ProjectRemoteRepository());
