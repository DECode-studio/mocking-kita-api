import { ChangeLog } from '@/src/client/domain/change-log/entity/change_log';

export interface ChangeLogRemoteDataSource {
  getChangeLogs(params: {
    search?: string;
    action?: string;
    projectId?: string;
    limit: number;
    offset: number;
  }): Promise<{ changeLogs: ChangeLog[]; totalCount: number }>;
}
