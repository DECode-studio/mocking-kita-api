import { NextResponse } from 'next/server';
import { dbRepository } from '@/src/data/resources/local/database-local-resource';

export const runtime = 'nodejs';

export async function GET() {
  const database = await dbRepository.getDatabase();
  return NextResponse.json(database);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string; payload?: unknown };
  const action = body.action;

  try {
    switch (action) {
      case 'saveDatabase':
        await dbRepository.saveDatabase(body.payload as any);
        return NextResponse.json({ ok: true });
      case 'resetDatabase':
        return NextResponse.json(await dbRepository.resetDatabase());
      case 'importDatabase': {
        const payload = body.payload as { data: any; mode: 'replace' | 'merge' };
        return NextResponse.json(await dbRepository.importDatabase(payload.data, payload.mode));
      }
      case 'create':
        return NextResponse.json(await dbRepository.create(body.payload as any));
      case 'update': {
        const payload = body.payload as { id: string; input: any };
        return NextResponse.json(await dbRepository.update(payload.id, payload.input));
      }
      case 'softDelete':
        await dbRepository.softDelete((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'restore':
        await dbRepository.restore((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'hardDelete':
        await dbRepository.hardDelete((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'createEnvironment':
        return NextResponse.json(await dbRepository.createEnvironment(body.payload as any));
      case 'updateEnvironment': {
        const payload = body.payload as { id: string; input: any };
        return NextResponse.json(await dbRepository.updateEnvironment(payload.id, payload.input));
      }
      case 'softDeleteEnvironment':
        await dbRepository.softDeleteEnvironment((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'createApi':
        return NextResponse.json(await dbRepository.createApi(body.payload as any));
      case 'updateApi': {
        const payload = body.payload as { id: string; input: any };
        return NextResponse.json(await dbRepository.updateApi(payload.id, payload.input));
      }
      case 'softDeleteApi':
        await dbRepository.softDeleteApi((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'upsertApiEnv':
        return NextResponse.json(await dbRepository.upsertApiEnv(body.payload as any));
      case 'createReqScenario':
        return NextResponse.json(await dbRepository.createReqScenario(body.payload as any));
      case 'updateReqScenario': {
        const payload = body.payload as { id: string; input: any };
        return NextResponse.json(await dbRepository.updateReqScenario(payload.id, payload.input));
      }
      case 'softDeleteReqScenario':
        await dbRepository.softDeleteReqScenario((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      case 'createRespScenario':
        return NextResponse.json(await dbRepository.createRespScenario(body.payload as any));
      case 'updateRespScenario': {
        const payload = body.payload as { id: string; input: any };
        return NextResponse.json(await dbRepository.updateRespScenario(payload.id, payload.input));
      }
      case 'softDeleteRespScenario':
        await dbRepository.softDeleteRespScenario((body.payload as { id: string }).id);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: 'Unknown database action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Database action failed' }, { status: 500 });
  }
}
