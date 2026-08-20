import { ChangeLog } from '../entity/change_log';

export interface ChangeLogRepository {
  getChangeLogs(params: {
    search?: string;
    action?: string;
    projectId?: string;
    limit: number;
    offset: number;
  }): Promise<{ changeLogs: ChangeLog[]; totalCount: number }>;
}
