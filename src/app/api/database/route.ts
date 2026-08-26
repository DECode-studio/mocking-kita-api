import { NextResponse } from 'next/server';
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
import { db } from '@/src/core/db/sqlite-client';

export const runtime = 'nodejs';

export async function GET() {
  const database = readDatabase();
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
        return NextResponse.json({ success: true, data: readDatabase() });
      case 'saveDatabase': {
        const before = getDatabaseSummary();
        seedDatabase(body.payload as any);
        const after = getDatabaseSummary();
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
        const before = getDatabaseSummary();
        const res = resetDatabaseToSeed();
        const after = getDatabaseSummary();
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
        const before = getDatabaseSummary();
        const res = importDatabaseData(payload.data, payload.mode);
        const after = getDatabaseSummary();
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
        const res = createProject({ ...input, id, createdAt: now, updatedAt: now });
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
        const before = getProjectById(payload.id);
        const res = updateProject(payload.id, payload.input);
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
        const before = getProjectById(id);
        softDeleteProject(id);
        const after = getProjectById(id);
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
        const before = getProjectById(id);
        restoreProject(id);
        const after = getProjectById(id);
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
        const before = getProjectById(id);
        hardDeleteProject(id);
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
        const res = createEnvironment({ ...input, id, createdAt: now, updatedAt: now });
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
        const before = getEnvironmentById(payload.id);
        const res = updateEnvironment(payload.id, payload.input);
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
        const before = getEnvironmentById(id);
        softDeleteEnvironment(id);
        const after = getEnvironmentById(id);
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
        const res = createApi({ ...input, id, createdAt: now, updatedAt: now });
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
        const before = getApiById(payload.id);
        const res = updateApi(payload.id, payload.input);
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
        const before = getApiById(id);
        softDeleteApi(id);
        const after = getApiById(id);
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
        const res = createCollection({ ...input, id, createdAt: now, updatedAt: now });
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
        const before = getCollectionById(payload.id);
        const res = updateCollection(payload.id, payload.input);
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
        const before = getCollectionById(id);
        softDeleteCollection(id);
        const after = getCollectionById(id);
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
        return respond(upsertApiEnvironment(body.payload as any));
      case 'createReqScenario': {
        const input = body.payload as any;
        const id = generateId();
        const res = createRequestScenario({ ...input, id, createdAt: now, updatedAt: now });
        const api = getApiById(res.apiId);
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
        const before = getRequestScenarioById(payload.id);
        const res = updateRequestScenario(payload.id, payload.input);
        const api = getApiById(res.apiId);
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
        const before = getRequestScenarioById(id);
        softDeleteRequestScenario(id);
        const after = getRequestScenarioById(id);
        let api = null;
        if (before) api = getApiById(before.apiId);
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
        const res = createResponseScenario({ ...input, id, createdAt: now, updatedAt: now });
        const reqSec = getRequestScenarioById(res.requestScenarioId);
        const api = reqSec ? getApiById(reqSec.apiId) : null;
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
        const before = getResponseScenarioById(payload.id);
        const res = updateResponseScenario(payload.id, payload.input);
        const reqSec = getRequestScenarioById(res.requestScenarioId);
        const api = reqSec ? getApiById(reqSec.apiId) : null;
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
        const before = getResponseScenarioById(id);
        softDeleteResponseScenario(id);
        const after = getResponseScenarioById(id);
        let api = null;
        if (before) {
          const reqSec = getRequestScenarioById(before.requestScenarioId);
          if (reqSec) api = getApiById(reqSec.apiId);
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
        return respond(exportProjectOpenApi(payload.projectId));
      }
      case 'importProjectOpenApi': {
        const payload = body.payload as { projectId: string; openApiJson: any; mode?: 'upsert' | 'merge' | 'replace' };
        const project = getProjectById(payload.projectId);
        const mode = payload.mode || 'upsert';
        const beforeApis = db.prepare('SELECT COUNT(*) as count FROM tblApi WHERE project_id = ?').get(payload.projectId) as { count: number };
        
        const res = importProjectOpenApi(payload.projectId, payload.openApiJson, mode);
        
        const afterApis = db.prepare('SELECT COUNT(*) as count FROM tblApi WHERE project_id = ?').get(payload.projectId) as { count: number };
        await logChange({
          action: 'IMPORT',
          entityType: 'project',
          entityId: payload.projectId,
          projectId: payload.projectId,
          beforeState: { apiCount: beforeApis?.count || 0 },
          afterState: { apiCount: afterApis?.count || 0 },
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
