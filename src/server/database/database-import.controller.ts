import { NextResponse } from 'next/server';
import { importDatabaseData } from '@/src/core/db/database_storage_helper';
import { importDatabaseSql } from '@/src/core/db/sql_database_storage_helper';
import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';
import { logChange, getDatabaseSummary } from '@/src/core/db/change_log_helper';
import { clearInternalProxyCache } from '@/src/server/mock-proxy/mock-proxy.cache';
import { requireAdminSession } from '@/src/core/server/auth/session';
import { jsonFail, jsonUnknownError } from '@/src/core/server/http/responses';
import { checkRateLimit, getRequestRateLimitKey } from '@/src/core/server/security/rate-limit';

const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

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
  const adminSession = await requireAdminSession();
  if (!adminSession) {
    return jsonFail('Forbidden', 403, 'FORBIDDEN');
  }

  const rateLimit = checkRateLimit(getRequestRateLimitKey(request, 'database-import'), 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many import requests', code: 'IMPORT_RATE_LIMITED' },
      { status: 429, headers: { 'retry-after': String(rateLimit.retryAfterSeconds ?? 1) } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const mode = formData.get('mode');

    if (!(file instanceof File)) {
      return jsonFail('Missing import file', 400, 'IMPORT_FILE_REQUIRED');
    }

    if (file.size > MAX_IMPORT_BYTES) {
      return jsonFail('Import file is too large', 413, 'IMPORT_FILE_TOO_LARGE');
    }

    const importMode = mode === 'replace' ? 'replace' : mode === 'merge' ? 'merge' : null;
    if (!importMode) {
      return jsonFail('Invalid import mode', 400, 'INVALID_IMPORT_MODE');
    }

    const fileName = file.name.toLowerCase();
    const text = await file.text();

    const before = await getDatabaseSummary();

    if (fileName.endsWith('.sql')) {
      const result = await importDatabaseSql(text, importMode);
      const after = await getDatabaseSummary();

      await logChange({
        action: 'IMPORT',
        entityType: 'database',
        beforeState: before,
        afterState: after,
        metadata: {
          mode: importMode,
          fileName: file.name,
          format: 'sql',
          statementsCount: result.statementsExecuted,
          chunksCount: result.chunksExecuted,
        },
        description: `Imported database SQL file '${file.name}' (${result.statementsExecuted} statements executed in ${result.chunksExecuted} chunks, mode: ${importMode})`,
      });
      clearInternalProxyCache();

      return NextResponse.json({
        success: true,
        data: {
          message: `Database imported successfully (${result.statementsExecuted} SQL statements in ${result.chunksExecuted} chunks)`,
        },
      });
    }

    if (fileName.endsWith('.json')) {
      const parsed = JSON.parse(text) as unknown;

      if (!isMockApiDatabase(parsed)) {
        return jsonFail('Invalid database structure in JSON file', 400, 'INVALID_DATABASE_IMPORT_SHAPE');
      }

      await importDatabaseData(parsed, importMode);
      const after = await getDatabaseSummary();

      await logChange({
        action: 'IMPORT',
        entityType: 'database',
        beforeState: before,
        afterState: after,
        metadata: { mode: importMode, fileName: file.name, format: 'json' },
        description: `Imported database JSON file '${file.name}' (mode: ${importMode})`,
      });
      clearInternalProxyCache();

      return NextResponse.json({
        success: true,
        data: {
          message: 'Database imported successfully',
        },
      });
    }

    return jsonFail('Unsupported file format. Please upload a .sql or .json backup file.', 400, 'UNSUPPORTED_IMPORT_FORMAT');
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonFail('Invalid JSON import file', 400, 'INVALID_JSON_IMPORT');
    }
    return jsonUnknownError('Database import failed', error, 'Import failed', 'DATABASE_IMPORT_FAILED');
  }
}
