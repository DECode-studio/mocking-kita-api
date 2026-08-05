import { ApiCollectionRemoteRepository } from '@/src/data/api/repository/api_repository';
import { ApiEnvironmentRemoteRepository } from '@/src/data/api/repository/api_environment_repository';
import { EnvironmentRemoteRepository } from '@/src/data/environment/repository/environment_repository';
import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import { RequestScenarioRemoteRepository } from '@/src/data/request-scenario/repository/request_scenario_repository';
import { ResponseScenarioRemoteRepository } from '@/src/data/response-scenario/repository/response_scenario_repository';
import { ApiDetailUseCaseImpl } from './usecase/api_detail_usecase';
import { ApiUseCaseImpl } from './usecase/api_usecase';

export function createApiUseCase() {
  return new ApiUseCaseImpl(new ApiCollectionRemoteRepository(), new ProjectRemoteRepository());
}

export function createApiDetailUseCase() {
  return new ApiDetailUseCaseImpl(
    new ProjectRemoteRepository(),
    new ApiCollectionRemoteRepository(),
    new EnvironmentRemoteRepository(),
    new ApiEnvironmentRemoteRepository(),
    new RequestScenarioRemoteRepository(),
    new ResponseScenarioRemoteRepository()
  );
}
