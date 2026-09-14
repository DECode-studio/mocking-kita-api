import { ok } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { getDashboardSummary } from '@/src/server/database/database-dashboard-summary.service';

export async function GET() {
  try {
    return ok(await getDashboardSummary());
  } catch (error) {
    return jsonUnknownError('Dashboard summary failed', error, 'Dashboard summary failed', 'DASHBOARD_SUMMARY_FAILED');
  }
}
