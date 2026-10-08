import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';
import { DatabaseImportResult } from '@/src/client/domain/database/repository/database_snapshot_repository';

export interface DatabaseSnapshotRemoteDataSource {
  getDatabaseSnapshot(): Promise<MockApiDatabase>;
  importDatabaseSnapshot(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
  resetDatabaseSnapshot(): Promise<void>;
  exportDatabase(format: 'json' | 'sql'): Promise<{ blob: Blob; filename: string }>;
  importDatabaseFile(file: File, mode: 'replace' | 'merge'): Promise<DatabaseImportResult>;
}

