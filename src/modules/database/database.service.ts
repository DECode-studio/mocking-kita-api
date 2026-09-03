import { z } from 'zod';
import { readDatabase } from '@/src/core/db/database_storage_helper';
import { canResetDatabase } from '@/src/core/constants/roles';
import { fail, ok } from '@/src/core/utils/api-response';
import { getServerSession } from '@/src/core/server/auth/session';
import { DatabaseActionBody, DatabaseActionSchema, DatabaseImportPayloadSchema } from './database.schema';
import { createDatabaseActionContext } from './database-action-context';
import { importDatabaseSnapshot, resetDatabaseSnapshot, saveDatabaseSnapshot } from './database-bulk.service';
import { handleApiDatabaseAction, handleRequestScenarioDatabaseAction, handleResponseScenarioDatabaseAction } from './database-api-actions.service';
import { handleCollectionDatabaseAction, handleEnvironmentDatabaseAction, handleProjectDatabaseAction } from './database-project-actions.service';
import { handleOpenApiDatabaseAction } from './database-openapi-actions.service';
import { handleQueryDatabaseAction } from './database-query-actions.service';

export const runtime = 'nodejs';

async function requireDatabaseMutationSession() {
  const session = await getServerSession();
  return canResetDatabase(session?.role) ? session : null;
}

export async function handleDatabaseGet() {
  const database = await readDatabase();
  return ok(database);
}

async function handleBulkDatabaseAction(body: DatabaseActionBody): Promise<Response | null> {
  const context = createDatabaseActionContext();

  switch (body.action) {
    case 'saveDatabase': {
      if (!(await requireDatabaseMutationSession())) {
        return fail('Forbidden: Save database action requires Admin or Manager role', 403, 'FORBIDDEN');
      }
      await saveDatabaseSnapshot(body.payload);
      return context.respondVoid();
    }
    case 'resetDatabase': {
      if (!(await requireDatabaseMutationSession())) {
        return fail('Forbidden: Reset database action requires Admin or Manager role', 403, 'FORBIDDEN');
      }
      return context.respond(await resetDatabaseSnapshot());
    }
    case 'importDatabase': {
      if (!(await requireDatabaseMutationSession())) {
        return fail('Forbidden: Import database action requires Admin or Manager role', 403, 'FORBIDDEN');
      }
      const payload = DatabaseImportPayloadSchema.parse(body.payload);
      return context.respond(await importDatabaseSnapshot(payload.data, payload.mode));
    }
    default:
      return null;
  }
}

async function dispatchDatabaseAction(body: DatabaseActionBody): Promise<Response | null> {
  if (body.action === 'getDatabase') {
    return ok(await readDatabase());
  }

  const context = createDatabaseActionContext();
  const handlers = [
    handleQueryDatabaseAction,
    handleBulkDatabaseAction,
    handleProjectDatabaseAction,
    handleEnvironmentDatabaseAction,
    handleCollectionDatabaseAction,
    handleApiDatabaseAction,
    handleRequestScenarioDatabaseAction,
    handleResponseScenarioDatabaseAction,
    handleOpenApiDatabaseAction,
  ];

  for (const handler of handlers) {
    const response = await handler(body, context);
    if (response) return response;
  }

  return null;
}

export async function handleDatabasePost(request: Request) {
  try {
    const body = DatabaseActionSchema.parse(await request.json());
    const response = await dispatchDatabaseAction(body);
    return response ?? fail('Unknown database action', 400, 'UNKNOWN_DATABASE_ACTION');
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return fail('Invalid database action request', 400, 'INVALID_DATABASE_ACTION_REQUEST');
    }

    console.error('Database action failed', error);
    return fail('Database action failed', 500, 'DATABASE_ACTION_FAILED');
  }
}
