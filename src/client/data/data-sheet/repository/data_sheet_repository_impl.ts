import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import {
  DataSheetFilterQuery,
  DataSheetRepository,
} from '@/src/client/domain/data-sheet/repository/data_sheet_repository';
import { DataSheetRemoteDataSource } from '../data_source/data_sheet_data_source';
import { DataSheetRemoteDataSourceImpl } from '../data_source/data_sheet_data_source_impl';

export class DataSheetRepositoryImpl implements DataSheetRepository {
  constructor(
    private readonly dataSource: DataSheetRemoteDataSource = new DataSheetRemoteDataSourceImpl()
  ) {}

  async getAll(filter?: DataSheetFilterQuery): Promise<DataSheet[]> {
    return this.dataSource.getAll(filter);
  }

  async getById(id: string): Promise<DataSheet | null> {
    return this.dataSource.getById(id);
  }

  async create(input: Partial<DataSheet> & { name: string; code: string }): Promise<DataSheet> {
    return this.dataSource.create(input);
  }

  async update(id: string, input: Partial<DataSheet>): Promise<DataSheet> {
    return this.dataSource.update(id, input);
  }

  async delete(id: string): Promise<void> {
    return this.dataSource.delete(id);
  }
}
