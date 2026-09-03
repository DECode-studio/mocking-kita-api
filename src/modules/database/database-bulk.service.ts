import { importDatabaseData, seedDatabase, wipeAllDatabaseData } from '@/src/core/db/database_storage_helper';
import { getDatabaseSummary, logChange } from '@/src/core/db/change_log_helper';
import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';

export async function saveDatabaseSnapshot(payload: unknown) {
  const before = await getDatabaseSummary();
  await seedDatabase(payload as MockApiDatabase);
  const after = await getDatabaseSummary();
  await logChange({
    action: 'IMPORT',
    entityType: 'database',
    beforeState: before,
    afterState: after,
    description: 'Imported and saved database',
  });
}

export async function resetDatabaseSnapshot() {
  const before = await getDatabaseSummary();
  const result = await wipeAllDatabaseData();
  const after = await getDatabaseSummary();
  await logChange({
    action: 'RESET',
    entityType: 'database',
    beforeState: before,
    afterState: after,
    description: 'Wiped all database records (empty database)',
  });
  return result;
}

export async function importDatabaseSnapshot(data: unknown, mode: 'replace' | 'merge') {
  const before = await getDatabaseSummary();
  const result = await importDatabaseData(data as MockApiDatabase, mode);
  const after = await getDatabaseSummary();
  await logChange({
    action: 'IMPORT',
    entityType: 'database',
    beforeState: before,
    afterState: after,
    metadata: { mode },
    description: `Imported database JSON (mode: ${mode})`,
  });
  return result;
}
