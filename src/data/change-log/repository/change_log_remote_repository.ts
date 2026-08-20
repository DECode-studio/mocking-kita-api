import { ChangeLog } from '@/src/domain/change-log/entity/change_log';
import { ChangeLogRepository } from '@/src/domain/change-log/repository/change_log_repository';
import { apiRequest } from '@/src/core/http-client/api-client';

export class ChangeLogRemoteRepository implements ChangeLogRepository {
  async getChangeLogs(params: {
    search?: string;
    action?: string;
    projectId?: string;
    limit: number;
    offset: number;
  }): Promise<{ changeLogs: ChangeLog[]; totalCount: number }> {
    let url = `/api/change-logs?limit=${params.limit}&offset=${params.offset}`;
    if (params.search) url += `&search=${encodeURIComponent(params.search)}`;
    if (params.action) url += `&action=${encodeURIComponent(params.action)}`;
    if (params.projectId) url += `&projectId=${encodeURIComponent(params.projectId)}`;

    const res = await apiRequest<{ success: boolean; changeLogs: ChangeLog[]; totalCount: number; error?: string }>(url);
    if (!res.success) {
      throw new Error(res.error || 'Failed to fetch change logs');
    }
    return {
      changeLogs: res.changeLogs,
      totalCount: res.totalCount,
    };
  }
}
