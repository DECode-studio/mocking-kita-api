import { DataSheet } from '../entity/data_sheet';

export interface DataSheetFilterQuery {
  projectId?: string | null;
  category?: string;
  search?: string;
  status?: boolean;
}

export interface DataSheetRepository {
  getAll(filter?: DataSheetFilterQuery): Promise<DataSheet[]>;
  getById(id: string): Promise<DataSheet | null>;
  create(input: Partial<DataSheet> & { name: string; code: string }): Promise<DataSheet>;
  update(id: string, input: Partial<DataSheet>): Promise<DataSheet>;
  delete(id: string): Promise<void>;
}
