import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/src/core/db/prisma-client';
import { readDatabase, resetDatabaseToSeed, importDatabaseData, seedDatabase } from '@/src/core/db/database_storage_helper';
import { createProject, updateProject, softDeleteProject, restoreProject, hardDeleteProject, getProjectById } from '@/src/data/project/data_source/project_data_source_impl';
import { createEnvironment, updateEnvironment, softDeleteEnvironment, getEnvironmentById } from '@/src/data/environment/data_source/environment_data_source_impl';
import { createApi, updateApi, softDeleteApi, getApiById } from '@/src/data/api/data_source/api_data_source_impl';
import { createCollection, updateCollection, softDeleteCollection, getCollectionById } from '@/src/data/collection/data_source/collection_data_source_impl';
import { upsertApiEnvironment } from '@/src/data/api/data_source/api_environment_data_source_impl';
import { createRequestScenario, updateRequestScenario, softDeleteRequestScenario, getRequestScenarioById } from '@/src/data/request-scenario/data_source/request_scenario_data_source_impl';
import { createResponseScenario, updateResponseScenario, softDeleteResponseScenario, getResponseScenarioById } from '@/src/data/response-scenario/data_source/response_scenario_data_source_impl';
import { generateId } from '@/src/core/utils/uuid';
import { clearInternalProxyCache } from '@/src/app/api/internal-proxy-cache';
import { exportProjectOpenApi, importProjectOpenApi } from '@/src/core/db/openapi_storage_helper';
import { logChange, getDatabaseSummary } from '@/src/core/db/change_log_helper';
import { canResetDatabase } from '@/src/core/constants/roles';

export const runtime = 'nodejs';

export async function GET() {
  const database = await readDatabase();
  return NextResponse.json({ success: true, data: database });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string; payload?: unknown };
  const action = body.action;

  try {
    const now = new Date().toISOString();
    const respond = <T>(data: T, init?: ResponseInit) => {
      clearInternalProxyCache();
      return NextResponse.json({ success: true, data }, init);
    };

    const respondVoid = (init?: ResponseInit) => {
      clearInternalProxyCache();
      return NextResponse.json({ success: true }, init);
    };

    switch (action) {
      case 'getDatabase':
        return NextResponse.json({ success: true, data: await readDatabase() });
      case 'saveDatabase': {
        const before = await getDatabaseSummary();
        await seedDatabase(body.payload as any);
        const after = await getDatabaseSummary();
        await logChange({
          action: 'IMPORT',
          entityType: 'database',
          beforeState: before,
          afterState: after,
          description: 'Imported and saved database',
        });
        return respondVoid();
      }
      case 'resetDatabase': {
        const cookieStore = await cookies();
        const rawSession = cookieStore.get('mock-api-studio-auth')?.value;
        let userRole: string | undefined;
        if (rawSession) {
          try {
            const session = JSON.parse(rawSession);
            userRole = session?.role;
          } catch {}
        }

        if (!canResetDatabase(userRole)) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: Reset database action requires Admin or Manager role' },
            { status: 403 }
          );
        }

        const before = await getDatabaseSummary();
        const res = await resetDatabaseToSeed();
        const after = await getDatabaseSummary();
        await logChange({
          action: 'RESET',
          entityType: 'database',
          beforeState: before,
          afterState: after,
          description: 'Reset database to initial seed data',
        });
        return respond(res);
      }
      case 'importDatabase': {
        const payload = body.payload as { data: any; mode: 'replace' | 'merge' };
        const before = await getDatabaseSummary();
        const res = await importDatabaseData(payload.data, payload.mode);
        const after = await getDatabaseSummary();
        await logChange({
          action: 'IMPORT',
          entityType: 'database',
          beforeState: before,
          afterState: after,
          metadata: { mode: payload.mode },
          description: `Imported database JSON (mode: ${payload.mode})`,
        });
        return respond(res);
      }
      case 'create': {
        const input = body.payload as any;
        const id = generateId();
        const res = await createProject({ ...input, id, createdAt: now, updatedAt: now });
        await logChange({
          action: 'CREATE',
          entityType: 'project',
          entityId: id,
          projectId: id,
          afterState: res,
          description: `Created project '${res.name}'`,
        });
        return respond(res);
      }
      case 'update': {
        const payload = body.payload as { id: string; input: any };
        const before = await getProjectById(payload.id);
        const res = await updateProject(payload.id, payload.input);
        await logChange({
          action: 'UPDATE',
          entityType: 'project',
          entityId: payload.id,
          projectId: payload.id,
          beforeState: before,
          afterState: res,
          description: `Updated project '${res.name}'`,
        });
        return respond(res);
      }
      case 'softDelete': {
        const id = (body.payload as { id: string }).id;
        const before = await getProjectById(id);
        await softDeleteProject(id);
        const after = await getProjectById(id);
        await logChange({
          action: 'DELETE',
          entityType: 'project',
          entityId: id,
          projectId: id,
          beforeState: before,
          afterState: after,
          description: `Soft-deleted project '${before?.name || id}'`,
        });
        return respondVoid();
      }
      case 'restore': {
        const id = (body.payload as { id: string }).id;
        const before = await getProjectById(id);
        await restoreProject(id);
        const after = await getProjectById(id);
        await logChange({
          action: 'RESTORE',
          entityType: 'project',
          entityId: id,
          projectId: id,
          beforeState: before,
          afterState: after,
          description: `Restored project '${before?.name || id}'`,
        });
        return respondVoid();
      }
      case 'hardDelete': {
        const id = (body.payload as { id: string }).id;
        const before = await getProjectById(id);
        await hardDeleteProject(id);
        await logChange({
          action: 'DELETE',
          entityType: 'project',
          entityId: id,
          projectId: id,
          beforeState: before,
          afterState: null,
          metadata: { hardDelete: true },
          description: `Permanently deleted project '${before?.name || id}'`,
        });
        return respondVoid();
      }
      case 'createEnvironment': {
        const input = body.payload as any;
        const id = generateId();
        const res = await createEnvironment({ ...input, id, createdAt: now, updatedAt: now });
        await logChange({
          action: 'CREATE',
          entityType: 'environment',
          entityId: id,
          projectId: res.projectId,
          afterState: res,
          description: `Created environment '${res.name}'`,
        });
        return respond(res);
      }
      case 'updateEnvironment': {
        const payload = body.payload as { id: string; input: any };
        const before = await getEnvironmentById(payload.id);
        const res = await updateEnvironment(payload.id, payload.input);
        await logChange({
          action: 'UPDATE',
          entityType: 'environment',
          entityId: payload.id,
          projectId: res.projectId,
          beforeState: before,
          afterState: res,
          description: `Updated environment '${res.name}'`,
        });
        return respond(res);
      }
      case 'softDeleteEnvironment': {
        const id = (body.payload as { id: string }).id;
        const before = await getEnvironmentById(id);
        await softDeleteEnvironment(id);
        const after = await getEnvironmentById(id);
        await logChange({
          action: 'DELETE',
          entityType: 'environment',
          entityId: id,
          projectId: before?.projectId,
          beforeState: before,
          afterState: after,
          description: `Soft-deleted environment '${before?.name || id}'`,
        });
        return respondVoid();
      }
      case 'createApi': {
        const input = body.payload as any;
        const id = generateId();
        const res = await createApi({ ...input, id, createdAt: now, updatedAt: now });
        await logChange({
          action: 'CREATE',
          entityType: 'api',
          entityId: id,
          projectId: res.projectId,
          afterState: res,
          description: `Created API '${res.name}' (${res.methodRequest} ${res.path})`,
        });
        return respond(res);
      }
      case 'updateApi': {
        const payload = body.payload as { id: string; input: any };
        const before = await getApiById(payload.id);
        const res = await updateApi(payload.id, payload.input);
        await logChange({
          action: 'UPDATE',
          entityType: 'api',
          entityId: payload.id,
          projectId: res.projectId,
          beforeState: before,
          afterState: res,
          description: `Updated API '${res.name}' (${res.methodRequest} ${res.path})`,
        });
        return respond(res);
      }
      case 'softDeleteApi': {
        const id = (body.payload as { id: string }).id;
        const before = await getApiById(id);
        await softDeleteApi(id);
        const after = await getApiById(id);
        await logChange({
          action: 'DELETE',
          entityType: 'api',
          entityId: id,
          projectId: before?.projectId,
          beforeState: before,
          afterState: after,
          description: `Soft-deleted API '${before?.name || id}'`,
        });
        return respondVoid();
      }
      case 'createCollection': {
        const input = body.payload as any;
        const id = generateId();
        const res = await createCollection({ ...input, id, createdAt: now, updatedAt: now });
        await logChange({
          action: 'CREATE',
          entityType: 'collection',
          entityId: id,
          projectId: res.projectId,
          afterState: res,
          description: `Created collection '${res.name}'`,
        });
        return respond(res);
      }
      case 'updateCollection': {
        const payload = body.payload as { id: string; input: any };
        const before = await getCollectionById(payload.id);
        const res = await updateCollection(payload.id, payload.input);
        await logChange({
          action: 'UPDATE',
          entityType: 'collection',
          entityId: payload.id,
          projectId: res.projectId,
          beforeState: before,
          afterState: res,
          description: `Updated collection '${res.name}'`,
        });
        return respond(res);
      }
      case 'softDeleteCollection': {
        const id = (body.payload as { id: string }).id;
        const before = await getCollectionById(id);
        await softDeleteCollection(id);
        const after = await getCollectionById(id);
        await logChange({
          action: 'DELETE',
          entityType: 'collection',
          entityId: id,
          projectId: before?.projectId,
          beforeState: before,
          afterState: after,
          description: `Soft-deleted collection '${before?.name || id}'`,
        });
        return respondVoid();
      }
      case 'upsertApiEnv':
        return respond(await upsertApiEnvironment(body.payload as any));
      case 'createReqScenario': {
        const input = body.payload as any;
        const id = generateId();
        const res = await createRequestScenario({ ...input, id, createdAt: now, updatedAt: now });
        const api = await getApiById(res.apiId);
        await logChange({
          action: 'CREATE',
          entityType: 'request_scenario',
          entityId: id,
          projectId: api?.projectId,
          afterState: res,
          description: `Created request scenario '${res.name}'`,
        });
        return respond(res);
      }
      case 'updateReqScenario': {
        const payload = body.payload as { id: string; input: any };
        const before = await getRequestScenarioById(payload.id);
        const res = await updateRequestScenario(payload.id, payload.input);
        const api = await getApiById(res.apiId);
        await logChange({
          action: 'UPDATE',
          entityType: 'request_scenario',
          entityId: payload.id,
          projectId: api?.projectId,
          beforeState: before,
          afterState: res,
          description: `Updated request scenario '${res.name}'`,
        });
        return respond(res);
      }
      case 'softDeleteReqScenario': {
        const id = (body.payload as { id: string }).id;
        const before = await getRequestScenarioById(id);
        await softDeleteRequestScenario(id);
        const after = await getRequestScenarioById(id);
        let api = null;
        if (before) api = await getApiById(before.apiId);
        await logChange({
          action: 'DELETE',
          entityType: 'request_scenario',
          entityId: id,
          projectId: api?.projectId,
          beforeState: before,
          afterState: after,
          description: `Soft-deleted request scenario '${before?.name || id}'`,
        });
        return respondVoid();
      }
      case 'createRespScenario': {
        const input = body.payload as any;
        const id = generateId();
        const res = await createResponseScenario({ ...input, id, createdAt: now, updatedAt: now });
        const reqSec = await getRequestScenarioById(res.requestScenarioId);
        const api = reqSec ? await getApiById(reqSec.apiId) : null;
        await logChange({
          action: 'CREATE',
          entityType: 'response_scenario',
          entityId: id,
          projectId: api?.projectId,
          afterState: res,
          description: `Created response scenario '${res.name}' (HTTP ${res.statusCode})`,
        });
        return respond(res);
      }
      case 'updateRespScenario': {
        const payload = body.payload as { id: string; input: any };
        const before = await getResponseScenarioById(payload.id);
        const res = await updateResponseScenario(payload.id, payload.input);
        const reqSec = await getRequestScenarioById(res.requestScenarioId);
        const api = reqSec ? await getApiById(reqSec.apiId) : null;
        await logChange({
          action: 'UPDATE',
          entityType: 'response_scenario',
          entityId: payload.id,
          projectId: api?.projectId,
          beforeState: before,
          afterState: res,
          description: `Updated response scenario '${res.name}' (HTTP ${res.statusCode})`,
        });
        return respond(res);
      }
      case 'softDeleteRespScenario': {
        const id = (body.payload as { id: string }).id;
        const before = await getResponseScenarioById(id);
        await softDeleteResponseScenario(id);
        const after = await getResponseScenarioById(id);
        let api = null;
        if (before) {
          const reqSec = await getRequestScenarioById(before.requestScenarioId);
          if (reqSec) api = await getApiById(reqSec.apiId);
        }
        await logChange({
          action: 'DELETE',
          entityType: 'response_scenario',
          entityId: id,
          projectId: api?.projectId,
          beforeState: before,
          afterState: after,
          description: `Soft-deleted response scenario '${before?.name || id}'`,
        });
        return respondVoid();
      }
      case 'exportProjectOpenApi': {
        const payload = body.payload as { projectId: string };
        return respond(await exportProjectOpenApi(payload.projectId));
      }
      case 'importProjectOpenApi': {
        const payload = body.payload as { projectId: string; openApiJson: any; mode?: 'upsert' | 'merge' | 'replace' };
        const project = await getProjectById(payload.projectId);
        const mode = payload.mode || 'upsert';
        const beforeApiCount = await prisma.api.count({ where: { projectId: payload.projectId } });

        const res = await importProjectOpenApi(payload.projectId, payload.openApiJson, mode);

        const afterApiCount = await prisma.api.count({ where: { projectId: payload.projectId } });
        await logChange({
          action: 'IMPORT',
          entityType: 'project',
          entityId: payload.projectId,
          projectId: payload.projectId,
          beforeState: { apiCount: beforeApiCount },
          afterState: { apiCount: afterApiCount },
          metadata: { mode, openApiImport: true },
          description: `Imported OpenAPI spec into project '${project?.name || payload.projectId}' (mode: ${mode})`,
        });
        return respond(res);
      }
      default:
        return NextResponse.json({ error: 'Unknown database action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Database action failed' }, { status: 500 });
  }
}
