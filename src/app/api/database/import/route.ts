import { NextResponse } from 'next/server';
import { importDatabaseData } from '@/src/core/db/database_storage_helper';
import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';
import { logChange, getDatabaseSummary } from '@/src/core/db/change_log_helper';

export const runtime = 'nodejs';

function isMockApiDatabase(value: unknown): value is MockApiDatabase {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as MockApiDatabase).projects) &&
    Array.isArray((value as MockApiDatabase).environments) &&
    Array.isArray((value as MockApiDatabase).collections) &&
    Array.isArray((value as MockApiDatabase).apiCollections) &&
    Array.isArray((value as MockApiDatabase).apiEnvironments) &&
    Array.isArray((value as MockApiDatabase).requestScenarios) &&
    Array.isArray((value as MockApiDatabase).responseScenarios)
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const mode = formData.get('mode');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Missing import file' }, { status: 400 });
    }

    const importMode = mode === 'replace' ? 'replace' : 'merge';
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;

    if (!isMockApiDatabase(parsed)) {
      return NextResponse.json({ success: false, error: 'Invalid database structure' }, { status: 400 });
    }

    const before = getDatabaseSummary();
    await importDatabaseData(parsed, importMode);
    const after = getDatabaseSummary();

    await logChange({
      action: 'IMPORT',
      entityType: 'database',
      beforeState: before,
      afterState: after,
      metadata: { mode: importMode, fileName: file.name },
      description: `Imported database JSON file '${file.name}' (mode: ${importMode})`,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Database imported successfully',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Import failed' }, { status: 500 });
  }
}
