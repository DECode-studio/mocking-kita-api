import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';

export interface DatabaseImportResult {
  message?: string;
  statementsExecuted?: number;
  chunksExecuted?: number;
}

export interface DatabaseSnapshotRepository {
  getDatabase(): Promise<MockApiDatabase>;
  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
  exportDatabase(format: 'json' | 'sql'): Promise<{ blob: Blob; filename: string }>;
  importDatabaseFile(file: File, mode: 'replace' | 'merge'): Promise<DatabaseImportResult>;
}

