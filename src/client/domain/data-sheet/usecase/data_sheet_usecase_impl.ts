import { DataSheet } from '../entity/data_sheet';
import { DataSheetFilterQuery, DataSheetRepository } from '../repository/data_sheet_repository';
import { DataSheetUseCase } from './data_sheet_usecase';

export class DataSheetUseCaseImpl implements DataSheetUseCase {
  constructor(private readonly repository: DataSheetRepository) {}

  async getAll(filter?: DataSheetFilterQuery): Promise<DataSheet[]> {
    const sheets = await this.repository.getAll(filter);
    return sheets.filter((s) => !s.deletedAt);
  }

  async getByProjectId(projectId?: string | null): Promise<DataSheet[]> {
    const sheets = await this.repository.getAll({ projectId });
    return sheets.filter((s) => !s.deletedAt);
  }

  async getById(id: string): Promise<DataSheet | null> {
    return this.repository.getById(id);
  }

  async create(input: Partial<DataSheet> & { name: string; code: string }): Promise<DataSheet> {
    return this.repository.create(input);
  }

  async update(id: string, input: Partial<DataSheet>): Promise<DataSheet> {
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async toggleStatus(id: string): Promise<DataSheet> {
    const sheet = await this.repository.getById(id);
    if (!sheet) {
      throw new Error('Data sheet not found');
    }
    return this.repository.update(id, { status: !sheet.status });
  }
}
