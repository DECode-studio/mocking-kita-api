import { ChangeLog } from '@/src/client/domain/change-log/entity/change_log';
import { ChangeLogRepository } from '@/src/client/domain/change-log/repository/change_log_repository';
import { ChangeLogRemoteDataSource } from '../data_source/change_log_data_source';
import { ChangeLogRemoteDataSourceImpl } from '../data_source/change_log_remote_data_source_impl';

export class ChangeLogRepositoryImpl implements ChangeLogRepository {
  constructor(private dataSource: ChangeLogRemoteDataSource = new ChangeLogRemoteDataSourceImpl()) {}

  async getChangeLogs(params: {
    search?: string;
    action?: string;
    projectId?: string;
    limit: number;
    offset: number;
  }): Promise<{ changeLogs: ChangeLog[]; totalCount: number }> {
    return this.dataSource.getChangeLogs(params);
  }
}
