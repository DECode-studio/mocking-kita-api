// Data repositories
import { ApiCollectionRemoteRepository } from '@/src/data/api/repository/api_repository';
import { ApiEnvironmentRemoteRepository } from '@/src/data/api/repository/api_environment_repository';
import { EnvironmentRemoteRepository } from '@/src/data/environment/repository/environment_repository';
import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import { RequestScenarioRemoteRepository } from '@/src/data/request-scenario/repository/request_scenario_repository';
import { ResponseScenarioRemoteRepository } from '@/src/data/response-scenario/repository/response_scenario_repository';
import { authRepository } from '@/src/data/auth/repository/auth_repository';
import { CollectionRemoteRepository } from '@/src/data/collection/repository/collection_repository';
import { databaseSnapshotRepository } from '@/src/data/database/snapshot/database_snapshot_repository_impl';
import { resetDatabaseRepository } from '@/src/data/database/admin/reset_database_repository_impl';
import { FaqRemoteRepository } from '@/src/data/faq/repository/faq_repository';

// Domain usecases
import { ApiDetailUseCaseImpl } from '@/src/domain/api/usecase/api_detail_usecase';
import { ApiUseCaseImpl } from '@/src/domain/api/usecase/api_usecase';
import { AuthUseCaseImpl } from '@/src/domain/auth/usecase/auth_usecase';
import { CollectionUseCase, CollectionUseCaseImpl } from '@/src/domain/collection/usecase/collection_usecase';
import { DatabaseSnapshotUseCaseImpl } from '@/src/domain/database/usecase/database_snapshot_usecase';
import { DatabaseResetUseCaseImpl } from '@/src/domain/database/usecase/database_reset_usecase';
import { EnvironmentUseCaseImpl } from '@/src/domain/environment/usecase/environment_usecase';
import { FaqUseCaseImpl } from '@/src/domain/faq/usecase/faq_usecase';
import { ProjectUseCaseImpl } from '@/src/domain/project/usecase/project_usecase';
import { AccountAdminUseCaseImpl } from '@/src/domain/account/usecase/account_admin_usecase';
import { AccountAdminRemoteRepository } from '@/src/data/account/repository/account_admin_remote_repository';
import { ChangeLogUseCaseImpl } from '@/src/domain/change-log/usecase/change_log_usecase';
import { ChangeLogRemoteRepository } from '@/src/data/change-log/repository/change_log_remote_repository';

// Factories
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

export function createAuthUseCase() {
  return new AuthUseCaseImpl(authRepository);
}

export function createCollectionUseCase(): CollectionUseCase {
  return new CollectionUseCaseImpl(new CollectionRemoteRepository());
}

export function createDatabaseSnapshotUseCase() {
  return new DatabaseSnapshotUseCaseImpl(databaseSnapshotRepository);
}

export function createDatabaseResetUseCase() {
  return new DatabaseResetUseCaseImpl(resetDatabaseRepository);
}

export function createEnvironmentUseCase() {
  return new EnvironmentUseCaseImpl(new EnvironmentRemoteRepository(), new ProjectRemoteRepository());
}

export function createFaqUseCase() {
  return new FaqUseCaseImpl(new FaqRemoteRepository());
}

export function createProjectUseCase() {
  return new ProjectUseCaseImpl(new ProjectRemoteRepository());
}

export function createAccountAdminUseCase() {
  return new AccountAdminUseCaseImpl(new AccountAdminRemoteRepository());
}

export function createChangeLogUseCase() {
  return new ChangeLogUseCaseImpl(new ChangeLogRemoteRepository());
}
