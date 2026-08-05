import { DashboardUseCaseImpl } from '@/src/domain/dashboard/usecase/dashboard_usecase';
import { dashboardRepository } from './repository/dashboard_repository_impl';

export const dashboardUseCase = new DashboardUseCaseImpl(dashboardRepository);
