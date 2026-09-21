import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendGoogleSpaceNotification } from '@/src/core/notification/google_space_notifier';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    account: { findUnique: vi.fn() },
    project: { findUnique: vi.fn() },
  },
}));

describe('Google Space notifier', () => {
  const originalWebhookUrl = process.env.GOOGLE_SPACE_WEBHOOK_URL;

  beforeEach(async () => {
    process.env.GOOGLE_SPACE_WEBHOOK_URL = 'https://chat.googleapis.test/webhook';
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as never;
    const prisma = (await import('@/src/core/db/prisma-client')).default;
    (prisma.account.findUnique as any).mockReset();
    (prisma.project.findUnique as any).mockReset();
  });

  afterEach(() => {
    process.env.GOOGLE_SPACE_WEBHOOK_URL = originalWebhookUrl;
    vi.restoreAllMocks();
  });

  it.each(['collection', 'environment', 'scenario_flow'] as const)('dispatches %s change notifications', async (entityType) => {
    await sendGoogleSpaceNotification({
      action: 'CREATE',
      entityType,
      entityId: `${entityType}-1`,
      operator: 'system',
      afterState: { id: `${entityType}-1`, name: `${entityType} one` },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://chat.googleapis.test/webhook',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it.each(['IMPORT', 'EXPORT', 'RESET'] as const)('dispatches database %s notifications', async (action) => {
    await sendGoogleSpaceNotification({
      action,
      entityType: 'database',
      operator: 'system',
      metadata: { format: action === 'EXPORT' ? 'json' : 'sql', fileName: 'backup.sql' },
      description: `${action} database backup`,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://chat.googleapis.test/webhook',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('tags multiple project PICs when project has pics with googleId', async () => {
    await sendGoogleSpaceNotification({
      action: 'CREATE',
      entityType: 'project',
      entityId: 'proj-1',
      operator: 'admin',
      afterState: {
        id: 'proj-1',
        name: 'Project Alpha',
        pics: [
          { id: 'user-1', name: 'Budi', username: 'budi', googleId: '1092837465' },
          { id: 'user-2', name: 'Dedi', username: 'dedi', googleId: '9876543210' },
        ],
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://chat.googleapis.test/webhook',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringMatching(/<users\/1092837465>.*<users\/9876543210>/),
      })
    );
  });

  it('tags both multiple API PICs and Project PICs when they have googleId', async () => {
    const prisma = (await import('@/src/core/db/prisma-client')).default;
    (prisma.project.findUnique as any).mockResolvedValue({
      pics: [
        { account: { id: 'user-project-pic', name: 'Ani', username: 'ani', googleId: '222222222' } },
      ],
    });

    await sendGoogleSpaceNotification({
      action: 'UPDATE',
      entityType: 'api',
      entityId: 'api-1',
      projectId: 'proj-1',
      operator: 'admin',
      afterState: {
        id: 'api-1',
        name: 'Get Users',
        path: '/api/users',
        methodRequest: 'GET',
        pics: [
          { id: 'user-api-pic-1', name: 'Cici', username: 'cici', googleId: '333333333' },
          { id: 'user-api-pic-2', name: 'Doni', username: 'doni', googleId: '444444444' },
        ],
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://chat.googleapis.test/webhook',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringMatching(/<users\/333333333>.*<users\/444444444>.*<users\/222222222>/),
      })
    );
  });

  it('does not add root text mention when neither entity has a PIC with googleId', async () => {
    await sendGoogleSpaceNotification({
      action: 'DELETE',
      entityType: 'project',
      entityId: 'proj-2',
      operator: 'admin',
      beforeState: {
        id: 'proj-2',
        name: 'Project Beta',
      },
    });

    const calls = (global.fetch as any).mock.calls;
    const lastCallBody = JSON.parse(calls[calls.length - 1][1].body);
    expect(lastCallBody.text).toBeUndefined();
    expect(lastCallBody.cardsV2).toBeDefined();
  });
});

