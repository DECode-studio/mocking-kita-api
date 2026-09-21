import { apiRequest } from '@/src/core/http-client/api-client';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { DataSheetFilterQuery } from '@/src/client/domain/data-sheet/repository/data_sheet_repository';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { DataSheetRemoteDataSource } from './data_sheet_data_source';

export class DataSheetRemoteDataSourceImpl implements DataSheetRemoteDataSource {
  async getAll(filter?: DataSheetFilterQuery): Promise<DataSheet[]> {
    const params = new URLSearchParams();
    if (filter?.projectId !== undefined && filter.projectId !== null) {
      params.append('projectId', filter.projectId);
    }
    if (filter?.category) {
      params.append('category', filter.category);
    }
    if (filter?.search) {
      params.append('search', filter.search);
    }
    if (filter?.status !== undefined) {
      params.append('status', String(filter.status));
    }

    const queryStr = params.toString();
    const url = `/api/data-sheets${queryStr ? `?${queryStr}` : ''}`;
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<DataSheet[]>>(url));
  }

  async getById(id: string): Promise<DataSheet | null> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<DataSheet | null>>(
        `/api/data-sheets/${encodeURIComponent(id)}`
      )
    );
  }

  async create(input: Partial<DataSheet> & { name: string; code: string }): Promise<DataSheet> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<DataSheet>>('/api/data-sheets', {
        method: 'POST',
        body: input,
      })
    );
  }

  async update(id: string, input: Partial<DataSheet>): Promise<DataSheet> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<DataSheet>>(
        `/api/data-sheets/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: input,
        }
      )
    );
  }

  async delete(id: string): Promise<void> {
    unwrapRemoteData(
      await apiRequest<RemoteEnvelope<void>>(
        `/api/data-sheets/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        }
      )
    );
  }
}
