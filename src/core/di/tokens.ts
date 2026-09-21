import { InjectionToken } from "@needle-di/core";
import type { ApiCollectionRepository } from "@/src/client/domain/api/repository/api_repository";
import type { ApiEnvironmentRepository } from "@/src/client/domain/api/repository/api_environment_repository";
import type { EnvironmentRepository } from "@/src/client/domain/environment/repository/environment_repository";
import type { ProjectRepository } from "@/src/client/domain/project/repository/project_repository";
import type { RequestScenarioRepository } from "@/src/client/domain/request-scenario/repository/request_scenario_repository";
import type { ResponseScenarioRepository } from "@/src/client/domain/response-scenario/repository/response_scenario_repository";
import type { AuthRepository } from "@/src/client/domain/auth/repository/auth_repository";
import type { CollectionRepository } from "@/src/client/domain/collection/repository/collection_repository";
import type { DatabaseSnapshotRepository } from "@/src/client/domain/database/repository/database_snapshot_repository";
import type { DatabaseResetRepository } from "@/src/client/domain/database/repository/database_reset_repository";
import type { FaqRepository } from "@/src/client/domain/faq/repository/faq_repository";
import type { AccountAdminRepository } from "@/src/client/domain/account/repository/account_admin_repository";
import type { ChangeLogRepository } from "@/src/client/domain/change-log/repository/change_log_repository";
import type { DashboardRepository } from "@/src/client/domain/dashboard/repository/dashboard_repository";
import type { ScenarioFlowRepository } from "@/src/client/domain/scenario-flow/repository/scenario_flow_repository";
import type { DataSheetRepository } from "@/src/client/domain/data-sheet/repository/data_sheet_repository";

// Domain UseCases Contracts
import type { ApiUseCase } from "@/src/client/domain/api/usecase/api_usecase";
import type { ApiDetailUseCase } from "@/src/client/domain/api/usecase/api_detail_usecase";
import type { AuthUseCase } from "@/src/client/domain/auth/usecase/auth_usecase";
import type { CollectionUseCase } from "@/src/client/domain/collection/usecase/collection_usecase";
import type { DatabaseSnapshotUseCase } from "@/src/client/domain/database/usecase/database_snapshot_usecase";
import type { DatabaseResetUseCase } from "@/src/client/domain/database/usecase/database_reset_usecase";
import type { EnvironmentUseCase } from "@/src/client/domain/environment/usecase/environment_usecase";
import type { FaqUseCase } from "@/src/client/domain/faq/usecase/faq_usecase";
import type { ProjectUseCase } from "@/src/client/domain/project/usecase/project_usecase";
import type { AccountAdminUseCase } from "@/src/client/domain/account/usecase/account_admin_usecase";
import type { ChangeLogUseCase } from "@/src/client/domain/change-log/usecase/change_log_usecase";
import type { DashboardUseCase } from "@/src/client/domain/dashboard/usecase/dashboard_usecase";
import type { ScenarioFlowUseCase } from "@/src/client/domain/scenario-flow/usecase/scenario_flow_usecase";
import type { DataSheetUseCase } from "@/src/client/domain/data-sheet/usecase/data_sheet_usecase";

export const CLIENT_DI_TOKENS = {
  // Repositories
  apiCollectionRepository: new InjectionToken<ApiCollectionRepository>("ApiCollectionRepository"),
  apiEnvironmentRepository: new InjectionToken<ApiEnvironmentRepository>("ApiEnvironmentRepository"),
  environmentRepository: new InjectionToken<EnvironmentRepository>("EnvironmentRepository"),
  projectRepository: new InjectionToken<ProjectRepository>("ProjectRepository"),
  requestScenarioRepository: new InjectionToken<RequestScenarioRepository>("RequestScenarioRepository"),
  responseScenarioRepository: new InjectionToken<ResponseScenarioRepository>("ResponseScenarioRepository"),
  authRepository: new InjectionToken<AuthRepository>("AuthRepository"),
  collectionRepository: new InjectionToken<CollectionRepository>("CollectionRepository"),
  databaseSnapshotRepository: new InjectionToken<DatabaseSnapshotRepository>("DatabaseSnapshotRepository"),
  resetDatabaseRepository: new InjectionToken<DatabaseResetRepository>("ResetDatabaseRepository"),
  faqRepository: new InjectionToken<FaqRepository>("FaqRepository"),
  accountAdminRepository: new InjectionToken<AccountAdminRepository>("AccountAdminRepository"),
  changeLogRepository: new InjectionToken<ChangeLogRepository>("ChangeLogRepository"),
  dashboardRepository: new InjectionToken<DashboardRepository>("DashboardRepository"),
  scenarioFlowRepository: new InjectionToken<ScenarioFlowRepository>("ScenarioFlowRepository"),
  dataSheetRepository: new InjectionToken<DataSheetRepository>("DataSheetRepository"),

  // UseCases
  apiUseCase: new InjectionToken<ApiUseCase>("ApiUseCase"),
  apiDetailUseCase: new InjectionToken<ApiDetailUseCase>("ApiDetailUseCase"),
  authUseCase: new InjectionToken<AuthUseCase>("AuthUseCase"),
  collectionUseCase: new InjectionToken<CollectionUseCase>("CollectionUseCase"),
  databaseSnapshotUseCase: new InjectionToken<DatabaseSnapshotUseCase>("DatabaseSnapshotUseCase"),
  resetDatabaseUseCase: new InjectionToken<DatabaseResetUseCase>("ResetDatabaseUseCase"),
  environmentUseCase: new InjectionToken<EnvironmentUseCase>("EnvironmentUseCase"),
  faqUseCase: new InjectionToken<FaqUseCase>("FaqUseCase"),
  projectUseCase: new InjectionToken<ProjectUseCase>("ProjectUseCase"),
  accountAdminUseCase: new InjectionToken<AccountAdminUseCase>("AccountAdminUseCase"),
  changeLogUseCase: new InjectionToken<ChangeLogUseCase>("ChangeLogUseCase"),
  dashboardUseCase: new InjectionToken<DashboardUseCase>("DashboardUseCase"),
  scenarioFlowUseCase: new InjectionToken<ScenarioFlowUseCase>("ScenarioFlowUseCase"),
  dataSheetUseCase: new InjectionToken<DataSheetUseCase>("DataSheetUseCase"),
} as const;
