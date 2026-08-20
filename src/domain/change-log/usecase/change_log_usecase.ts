import { ChangeLog } from '../entity/change_log';
import { ChangeLogRepository } from '../repository/change_log_repository';

export interface ChangeLogUseCase {
  getChangeLogs(params: {
    search?: string;
    action?: string;
    projectId?: string;
    limit: number;
    offset: number;
  }): Promise<{ changeLogs: ChangeLog[]; totalCount: number }>;
}

export class ChangeLogUseCaseImpl implements ChangeLogUseCase {
  constructor(private readonly repository: ChangeLogRepository) {}

  getChangeLogs(params: {
    search?: string;
    action?: string;
    projectId?: string;
    limit: number;
    offset: number;
  }): Promise<{ changeLogs: ChangeLog[]; totalCount: number }> {
    return this.repository.getChangeLogs(params);
  }
}
