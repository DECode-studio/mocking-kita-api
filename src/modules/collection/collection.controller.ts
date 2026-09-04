import { z } from 'zod';
import { fail, ok, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { generateId } from '@/src/core/utils/uuid';
import { logChange } from '@/src/core/db/change_log_helper';
import { clearInternalProxyCache } from '@/src/modules/mock-proxy/mock-proxy.cache';
import { createCollection, getCollectionById, getCollectionsByProjectId, softDeleteCollection, updateCollection } from './collection.repository';

const ObjectSchema = z.record(z.string(), z.unknown());
const IdParamsSchema = z.object({ id: z.string().trim().min(1) });
const ProjectParamsSchema = z.object({ id: z.string().trim().min(1) });

export async function listCollectionsByProjectRoute(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = ProjectParamsSchema.parse(await context.params);
    return ok(await getCollectionsByProjectId(id));
  } catch (error) {
    return jsonUnknownError('Collection list failed', error, 'Collection list failed', 'COLLECTION_LIST_FAILED');
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
    return ok(await getCollectionById(id));
  } catch (error) {
    return jsonUnknownError('Collection request failed', error, 'Collection request failed', 'COLLECTION_REQUEST_FAILED');
  }
}

export async function POST(request: Request) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const now = new Date().toISOString();
    const id = generateId();
    const collection = await createCollection({ ...input, id, createdAt: now, updatedAt: now } as never);
    await logChange({
      action: 'CREATE',
      entityType: 'collection',
      entityId: id,
      projectId: collection.projectId,
      afterState: collection,
      description: `Created collection '${collection.name}'`,
    });
    clearInternalProxyCache();
    return ok(collection);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid collection request', 400, 'INVALID_COLLECTION_REQUEST');
    return jsonUnknownError('Collection create failed', error, 'Collection create failed', 'COLLECTION_CREATE_FAILED');
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const { id } = IdParamsSchema.parse(await context.params);
    const before = await getCollectionById(id);
    const collection = await updateCollection(id, input);
    await logChange({
      action: 'UPDATE',
      entityType: 'collection',
      entityId: id,
      projectId: collection.projectId,
      beforeState: before,
      afterState: collection,
      description: `Updated collection '${collection.name}'`,
    });
    clearInternalProxyCache();
    return ok(collection);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail('Invalid collection request', 400, 'INVALID_COLLECTION_REQUEST');
    return jsonUnknownError('Collection update failed', error, 'Collection update failed', 'COLLECTION_UPDATE_FAILED');
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = IdParamsSchema.parse(await context.params);
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
    clearInternalProxyCache();
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Collection delete failed', error, 'Collection delete failed', 'COLLECTION_DELETE_FAILED');
  }
}
