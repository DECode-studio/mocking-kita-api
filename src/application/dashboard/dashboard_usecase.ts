import { DashboardUseCaseImpl } from '@/src/domain/dashboard/usecase/dashboard_usecase';
import { dashboardRepository } from '@/src/infrastructure/dashboard/dashboard_repository_impl';

export const dashboardUseCase = new DashboardUseCaseImpl(dashboardRepository);
