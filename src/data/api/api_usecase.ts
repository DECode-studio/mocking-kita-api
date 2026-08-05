import { ApiCollectionRemoteRepository } from './repository/api_repository';
import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import { ApiUseCaseImpl } from '@/src/domain/api/usecase/api_usecase';

export const apiUseCase = new ApiUseCaseImpl(new ApiCollectionRemoteRepository(), new ProjectRemoteRepository());
