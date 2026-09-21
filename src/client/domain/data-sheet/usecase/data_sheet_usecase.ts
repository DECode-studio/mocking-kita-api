import { DataSheet } from '../entity/data_sheet';
import { DataSheetFilterQuery } from '../repository/data_sheet_repository';

export interface DataSheetUseCase {
  getAll(filter?: DataSheetFilterQuery): Promise<DataSheet[]>;
  getByProjectId(projectId?: string | null): Promise<DataSheet[]>;
  getById(id: string): Promise<DataSheet | null>;
  create(input: Partial<DataSheet> & { name: string; code: string }): Promise<DataSheet>;
  update(id: string, input: Partial<DataSheet>): Promise<DataSheet>;
  delete(id: string): Promise<void>;
  toggleStatus(id: string): Promise<DataSheet>;
}
