import { NextResponse } from 'next/server';
import { readDatabase, resetDatabaseToSeed, importDatabaseData, seedDatabase } from '@/src/data/database/database_storage_helper';
import { createProject, updateProject, softDeleteProject, restoreProject, hardDeleteProject } from '@/src/data/project/data_source/project_data_source_impl';
import { createEnvironment, updateEnvironment, softDeleteEnvironment } from '@/src/data/environment/data_source/environment_data_source_impl';
import { createApi, updateApi, softDeleteApi } from '@/src/data/api/data_source/api_data_source_impl';
import { upsertApiEnvironment } from '@/src/data/api/data_source/api_environment_data_source_impl';
import { createRequestScenario, updateRequestScenario, softDeleteRequestScenario } from '@/src/data/request-scenario/data_source/request_scenario_data_source_impl';
import { createResponseScenario, updateResponseScenario, softDeleteResponseScenario } from '@/src/data/response-scenario/data_source/response_scenario_data_source_impl';
import { generateId } from '@/src/core/utils/uuid';

export const runtime = 'nodejs';

export async function GET() {
  const database = readDatabase();
  return NextResponse.json(database);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string; payload?: unknown };
  const action = body.action;

  try {
    const now = new Date().toISOString();
    switch (action) {
      case 'getDatabase':
        return NextResponse.json(readDatabase());
      case 'saveDatabase':
        seedDatabase(body.payload as any);
        return NextResponse.json({ ok: true });
      case 'resetDatabase':
        return NextResponse.json(resetDatabaseToSeed());
      case 'importDatabase': {
        const payload = body.payload as { data: any; mode: 'replace' | 'merge' };
        return NextResponse.json(importDatabaseData(payload.data, payload.mode));
      }
      case 'create': {
        const input = body.payload as any;
        return NextResponse.json(createProject({ ...input, id: generateId(), createdAt: now, updatedAt: now }));
      }
      case 'update': {
        const payload = body.payload as { id: string; input: any };
        return NextResponse.json(updateProject(payload.id, payload.input));
      }
      case 'softDelete':
        softDeleteProject((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'restore':
        restoreProject((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'hardDelete':
        hardDeleteProject((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'createEnvironment': {
        const input = body.payload as any;
        return NextResponse.json(createEnvironment({ ...input, id: generateId(), createdAt: now, updatedAt: now }));
      }
      case 'updateEnvironment': {
        const payload = body.payload as { id: string; input: any };
        return NextResponse.json(updateEnvironment(payload.id, payload.input));
      }
      case 'softDeleteEnvironment':
        softDeleteEnvironment((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'createApi': {
        const input = body.payload as any;
        return NextResponse.json(createApi({ ...input, id: generateId(), createdAt: now, updatedAt: now }));
      }
      case 'updateApi': {
        const payload = body.payload as { id: string; input: any };
        return NextResponse.json(updateApi(payload.id, payload.input));
      }
      case 'softDeleteApi':
        softDeleteApi((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'upsertApiEnv':
        return NextResponse.json(upsertApiEnvironment(body.payload as any));
      case 'createReqScenario': {
        const input = body.payload as any;
        return NextResponse.json(createRequestScenario({ ...input, id: generateId(), createdAt: now, updatedAt: now }));
      }
      case 'updateReqScenario': {
        const payload = body.payload as { id: string; input: any };
        return NextResponse.json(updateRequestScenario(payload.id, payload.input));
      }
      case 'softDeleteReqScenario':
        softDeleteRequestScenario((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'createRespScenario': {
        const input = body.payload as any;
        return NextResponse.json(createResponseScenario({ ...input, id: generateId(), createdAt: now, updatedAt: now }));
      }
      case 'updateRespScenario': {
        const payload = body.payload as { id: string; input: any };
        return NextResponse.json(updateResponseScenario(payload.id, payload.input));
      }
      case 'softDeleteRespScenario':
        softDeleteResponseScenario((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: 'Unknown database action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Database action failed' }, { status: 500 });
  }
}
