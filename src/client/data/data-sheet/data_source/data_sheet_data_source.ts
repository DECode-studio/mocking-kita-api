import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { DataSheetFilterQuery } from '@/src/client/domain/data-sheet/repository/data_sheet_repository';

export interface DataSheetRemoteDataSource {
  getAll(filter?: DataSheetFilterQuery): Promise<DataSheet[]>;
  getById(id: string): Promise<DataSheet | null>;
  create(input: Partial<DataSheet> & { name: string; code: string }): Promise<DataSheet>;
  update(id: string, input: Partial<DataSheet>): Promise<DataSheet>;
  delete(id: string): Promise<void>;
}
