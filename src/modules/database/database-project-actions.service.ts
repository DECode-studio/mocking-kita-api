import { createCollection, getCollectionById, softDeleteCollection, updateCollection } from '@/src/modules/collection';
import { createEnvironment, getEnvironmentById, softDeleteEnvironment, updateEnvironment } from '@/src/modules/environment';
import { createProject, getProjectById, hardDeleteProject, restoreProject, softDeleteProject, updateProject } from '@/src/modules/project';
import { logChange } from '@/src/core/db/change_log_helper';
import { generateId } from '@/src/core/utils/uuid';
import { DatabaseActionContext } from './database-action-context';
import { DatabaseActionBody, IdPayloadSchema, ObjectPayloadSchema, UpdatePayloadSchema } from './database.schema';

export async function handleProjectDatabaseAction(body: DatabaseActionBody, context: DatabaseActionContext): Promise<Response | null> {
  switch (body.action) {
    case 'create': {
      const input = ObjectPayloadSchema.parse(body.payload);
      const id = generateId();
      const result = await createProject({ ...input, id, createdAt: context.now, updatedAt: context.now } as never);
      await logChange({
        action: 'CREATE',
        entityType: 'project',
        entityId: id,
        projectId: id,
        afterState: result,
        description: `Created project '${result.name}'`,
      });
      return context.respond(result);
    }
    case 'update': {
      const payload = UpdatePayloadSchema.parse(body.payload);
      const before = await getProjectById(payload.id);
      const result = await updateProject(payload.id, payload.input);
      await logChange({
        action: 'UPDATE',
        entityType: 'project',
        entityId: payload.id,
        projectId: payload.id,
        beforeState: before,
        afterState: result,
        description: `Updated project '${result.name}'`,
      });
      return context.respond(result);
    }
    case 'softDelete': {
      const { id } = IdPayloadSchema.parse(body.payload);
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
      return context.respondVoid();
    }
    case 'restore': {
      const { id } = IdPayloadSchema.parse(body.payload);
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
      return context.respondVoid();
    }
    case 'hardDelete': {
      const { id } = IdPayloadSchema.parse(body.payload);
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
      return context.respondVoid();
    }
    default:
      return null;
  }
}

export async function handleEnvironmentDatabaseAction(body: DatabaseActionBody, context: DatabaseActionContext): Promise<Response | null> {
  switch (body.action) {
    case 'createEnvironment': {
      const input = ObjectPayloadSchema.parse(body.payload);
      const id = generateId();
      const result = await createEnvironment({ ...input, id, createdAt: context.now, updatedAt: context.now } as never);
      await logChange({
        action: 'CREATE',
        entityType: 'environment',
        entityId: id,
        projectId: result.projectId,
        afterState: result,
        description: `Created environment '${result.name}'`,
      });
      return context.respond(result);
    }
    case 'updateEnvironment': {
      const payload = UpdatePayloadSchema.parse(body.payload);
      const before = await getEnvironmentById(payload.id);
      const result = await updateEnvironment(payload.id, payload.input);
      await logChange({
        action: 'UPDATE',
        entityType: 'environment',
        entityId: payload.id,
        projectId: result.projectId,
        beforeState: before,
        afterState: result,
        description: `Updated environment '${result.name}'`,
      });
      return context.respond(result);
    }
    case 'softDeleteEnvironment': {
      const { id } = IdPayloadSchema.parse(body.payload);
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
      return context.respondVoid();
    }
    default:
      return null;
  }
}

export async function handleCollectionDatabaseAction(body: DatabaseActionBody, context: DatabaseActionContext): Promise<Response | null> {
  switch (body.action) {
    case 'createCollection': {
      const input = ObjectPayloadSchema.parse(body.payload);
      const id = generateId();
      const result = await createCollection({ ...input, id, createdAt: context.now, updatedAt: context.now } as never);
      await logChange({
        action: 'CREATE',
        entityType: 'collection',
        entityId: id,
        projectId: result.projectId,
        afterState: result,
        description: `Created collection '${result.name}'`,
      });
      return context.respond(result);
    }
    case 'updateCollection': {
      const payload = UpdatePayloadSchema.parse(body.payload);
      const before = await getCollectionById(payload.id);
      const result = await updateCollection(payload.id, payload.input);
      await logChange({
        action: 'UPDATE',
        entityType: 'collection',
        entityId: payload.id,
        projectId: result.projectId,
        beforeState: before,
        afterState: result,
        description: `Updated collection '${result.name}'`,
      });
      return context.respond(result);
    }
    case 'softDeleteCollection': {
      const { id } = IdPayloadSchema.parse(body.payload);
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
      return context.respondVoid();
    }
    default:
      return null;
  }
}
