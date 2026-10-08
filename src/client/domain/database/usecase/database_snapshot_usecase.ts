import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';
import { DatabaseImportResult } from '../repository/database_snapshot_repository';

export interface DatabaseSnapshotUseCase {
  getDatabase(): Promise<MockApiDatabase>;
  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
  exportDatabase(format: 'json' | 'sql'): Promise<{ blob: Blob; filename: string }>;
  importDatabaseFile(file: File, mode: 'replace' | 'merge'): Promise<DatabaseImportResult>;
}


