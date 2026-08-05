import { ApiCollectionRemoteRepository } from './repository/api_repository';
import { ApiEnvironmentRemoteRepository } from './repository/api_environment_repository';
import { EnvironmentRemoteRepository } from '@/src/data/environment/repository/environment_repository';
import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import { RequestScenarioRemoteRepository } from '@/src/data/request-scenario/repository/request_scenario_repository';
import { ResponseScenarioRemoteRepository } from '@/src/data/response-scenario/repository/response_scenario_repository';
import { ApiDetailUseCaseImpl } from '@/src/domain/api/usecase/api_detail_usecase';

export const apiDetailUseCase = new ApiDetailUseCaseImpl(
  new ProjectRemoteRepository(),
  new ApiCollectionRemoteRepository(),
  new EnvironmentRemoteRepository(),
  new ApiEnvironmentRemoteRepository(),
  new RequestScenarioRemoteRepository(),
  new ResponseScenarioRemoteRepository()
);
