import { Container, type Token } from "@needle-di/core";

// Data Repositories
import { ApiCollectionRepositoryImpl } from '@/src/client/data/api/repository/api_collection_repository_impl';
import { ApiEnvironmentRepositoryImpl } from '@/src/client/data/api/repository/api_environment_repository_impl';
import { EnvironmentRepositoryImpl } from '@/src/client/data/environment/repository/environment_repository_impl';
import { ProjectRepositoryImpl } from '@/src/client/data/project/repository/project_repository_impl';
import { RequestScenarioRepositoryImpl } from '@/src/client/data/request-scenario/repository/request_scenario_repository_impl';
import { ResponseScenarioRepositoryImpl } from '@/src/client/data/response-scenario/repository/response_scenario_repository_impl';
import { AuthRepositoryImpl } from '@/src/client/data/auth/repository/auth_repository_impl';
import { CollectionRepositoryImpl } from '@/src/client/data/collection/repository/collection_repository_impl';
import { DatabaseSnapshotRepositoryImpl } from '@/src/client/data/database/repository/database_snapshot_repository_impl';
import { DatabaseResetRepositoryImpl } from '@/src/client/data/database/repository/database_reset_repository_impl';
import { FaqRepositoryImpl } from '@/src/client/data/faq/repository/faq_repository_impl';
import { AccountAdminRepositoryImpl } from '@/src/client/data/account/repository/account_admin_repository_impl';
import { ChangeLogRepositoryImpl } from '@/src/client/data/change-log/repository/change_log_repository_impl';
import { DashboardRepositoryImpl } from '@/src/client/data/dashboard/repository/dashboard_repository_impl';
import { ScenarioFlowRepositoryImpl } from '@/src/client/data/scenario-flow/repository/scenario_flow_repository_impl';
import { DataSheetRepositoryImpl } from '@/src/client/data/data-sheet/repository/data_sheet_repository_impl';

// Domain UseCases Implementations
import { ApiDetailUseCaseImpl } from '@/src/client/domain/api/usecase/api_detail_usecase_impl';
import { ApiUseCaseImpl } from '@/src/client/domain/api/usecase/api_usecase_impl';
import { AuthUseCaseImpl } from '@/src/client/domain/auth/usecase/auth_usecase_impl';
import { CollectionUseCaseImpl } from '@/src/client/domain/collection/usecase/collection_usecase_impl';
import { DatabaseSnapshotUseCaseImpl } from '@/src/client/domain/database/usecase/database_snapshot_usecase_impl';
import { DatabaseResetUseCaseImpl } from '@/src/client/domain/database/usecase/database_reset_usecase_impl';
import { EnvironmentUseCaseImpl } from '@/src/client/domain/environment/usecase/environment_usecase_impl';
import { FaqUseCaseImpl } from '@/src/client/domain/faq/usecase/faq_usecase_impl';
import { ProjectUseCaseImpl } from '@/src/client/domain/project/usecase/project_usecase_impl';
import { AccountAdminUseCaseImpl } from '@/src/client/domain/account/usecase/account_admin_usecase_impl';
import { ChangeLogUseCaseImpl } from '@/src/client/domain/change-log/usecase/change_log_usecase_impl';
import { DashboardUseCaseImpl } from '@/src/client/domain/dashboard/usecase/dashboard_usecase_impl';
import { ScenarioFlowUseCaseImpl } from '@/src/client/domain/scenario-flow/usecase/scenario_flow_usecase_impl';
import { DataSheetUseCaseImpl } from '@/src/client/domain/data-sheet/usecase/data_sheet_usecase_impl';

import { CLIENT_DI_TOKENS } from './tokens';

export const appContainer = new Container();

appContainer.bindAll(
  // Repositories
  {
    provide: CLIENT_DI_TOKENS.apiCollectionRepository,
    useFactory: () => new ApiCollectionRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.apiEnvironmentRepository,
    useFactory: () => new ApiEnvironmentRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.environmentRepository,
    useFactory: () => new EnvironmentRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.projectRepository,
    useFactory: () => new ProjectRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.requestScenarioRepository,
    useFactory: () => new RequestScenarioRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.responseScenarioRepository,
    useFactory: () => new ResponseScenarioRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.authRepository,
    useFactory: () => new AuthRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.collectionRepository,
    useFactory: () => new CollectionRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.databaseSnapshotRepository,
    useFactory: () => new DatabaseSnapshotRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.resetDatabaseRepository,
    useFactory: () => new DatabaseResetRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.faqRepository,
    useFactory: () => new FaqRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.accountAdminRepository,
    useFactory: () => new AccountAdminRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.changeLogRepository,
    useFactory: () => new ChangeLogRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.dashboardRepository,
    useFactory: () => new DashboardRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.scenarioFlowRepository,
    useFactory: () => new ScenarioFlowRepositoryImpl(),
  },
  {
    provide: CLIENT_DI_TOKENS.dataSheetRepository,
    useFactory: () => new DataSheetRepositoryImpl(),
  },

  // UseCases bound to InjectionTokens
  {
    provide: CLIENT_DI_TOKENS.apiUseCase,
    useFactory: (container) =>
      new ApiUseCaseImpl(
        container.get(CLIENT_DI_TOKENS.apiCollectionRepository),
        container.get(CLIENT_DI_TOKENS.projectRepository)
      ),
  },
  {
    provide: CLIENT_DI_TOKENS.apiDetailUseCase,
    useFactory: (container) =>
      new ApiDetailUseCaseImpl(
        container.get(CLIENT_DI_TOKENS.projectRepository),
        container.get(CLIENT_DI_TOKENS.apiCollectionRepository),
        container.get(CLIENT_DI_TOKENS.requestScenarioRepository),
        container.get(CLIENT_DI_TOKENS.responseScenarioRepository)
      ),
  },
  {
    provide: CLIENT_DI_TOKENS.authUseCase,
    useFactory: (container) =>
      new AuthUseCaseImpl(container.get(CLIENT_DI_TOKENS.authRepository)),
  },
  {
    provide: CLIENT_DI_TOKENS.collectionUseCase,
    useFactory: (container) =>
      new CollectionUseCaseImpl(container.get(CLIENT_DI_TOKENS.collectionRepository)),
  },
  {
    provide: CLIENT_DI_TOKENS.databaseSnapshotUseCase,
    useFactory: (container) =>
      new DatabaseSnapshotUseCaseImpl(container.get(CLIENT_DI_TOKENS.databaseSnapshotRepository)),
  },
  {
    provide: CLIENT_DI_TOKENS.resetDatabaseUseCase,
    useFactory: (container) =>
      new DatabaseResetUseCaseImpl(container.get(CLIENT_DI_TOKENS.resetDatabaseRepository)),
  },
  {
    provide: CLIENT_DI_TOKENS.environmentUseCase,
    useFactory: (container) =>
      new EnvironmentUseCaseImpl(
        container.get(CLIENT_DI_TOKENS.environmentRepository),
        container.get(CLIENT_DI_TOKENS.projectRepository)
      ),
  },
  {
    provide: CLIENT_DI_TOKENS.faqUseCase,
    useFactory: (container) =>
      new FaqUseCaseImpl(container.get(CLIENT_DI_TOKENS.faqRepository)),
  },
  {
    provide: CLIENT_DI_TOKENS.projectUseCase,
    useFactory: (container) =>
      new ProjectUseCaseImpl(container.get(CLIENT_DI_TOKENS.projectRepository)),
  },
  {
    provide: CLIENT_DI_TOKENS.accountAdminUseCase,
    useFactory: (container) =>
      new AccountAdminUseCaseImpl(container.get(CLIENT_DI_TOKENS.accountAdminRepository)),
  },
  {
    provide: CLIENT_DI_TOKENS.changeLogUseCase,
    useFactory: (container) =>
      new ChangeLogUseCaseImpl(container.get(CLIENT_DI_TOKENS.changeLogRepository)),
  },
  {
    provide: CLIENT_DI_TOKENS.dashboardUseCase,
    useFactory: (container) =>
      new DashboardUseCaseImpl(container.get(CLIENT_DI_TOKENS.dashboardRepository)),
  },
  {
    provide: CLIENT_DI_TOKENS.scenarioFlowUseCase,
    useFactory: (container) =>
      new ScenarioFlowUseCaseImpl(container.get(CLIENT_DI_TOKENS.scenarioFlowRepository)),
  },
  {
    provide: CLIENT_DI_TOKENS.dataSheetUseCase,
    useFactory: (container) =>
      new DataSheetUseCaseImpl(container.get(CLIENT_DI_TOKENS.dataSheetRepository)),
  }
);

export function getService<T>(token: Token<T>): T {
  return appContainer.get(token);
}
