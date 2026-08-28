import { readDatabase } from '@/src/core/db/database_storage_helper';

export const runtime = 'nodejs';

export async function GET() {
  const database = await readDatabase();
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const body = JSON.stringify(database, null, 2);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="mock-api-studio-backup-${YYYY}-${MM}-${DD}-${HH}${mm}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
