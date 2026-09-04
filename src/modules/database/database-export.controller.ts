import { readDatabase } from '@/src/core/db/database_storage_helper';
import { generateDatabaseSqlDump } from '@/src/core/db/sql_database_storage_helper';
import { requireAdminSession } from '@/src/core/server/auth/session';
import { jsonFail } from '@/src/core/server/http/responses';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const adminSession = await requireAdminSession();
  if (!adminSession) {
    return jsonFail('Forbidden', 403, 'FORBIDDEN');
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'sql';

  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const timestamp = `${YYYY}-${MM}-${DD}-${HH}${mm}`;

  if (format === 'json') {
    const database = await readDatabase();
    const body = JSON.stringify(database, null, 2);
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="mock-api-studio-backup-${timestamp}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // Default: SQL format (.sql)
  const sqlBody = await generateDatabaseSqlDump('upsert');
  return new Response(sqlBody, {
    headers: {
      'Content-Type': 'application/sql; charset=utf-8',
      'Content-Disposition': `attachment; filename="mock-api-studio-backup-${timestamp}.sql"`,
      'Cache-Control': 'no-store',
    },
  });
}

