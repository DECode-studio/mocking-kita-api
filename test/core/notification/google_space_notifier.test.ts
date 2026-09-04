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

  beforeEach(() => {
    process.env.GOOGLE_SPACE_WEBHOOK_URL = 'https://chat.googleapis.test/webhook';
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as never;
  });

  afterEach(() => {
    process.env.GOOGLE_SPACE_WEBHOOK_URL = originalWebhookUrl;
    vi.restoreAllMocks();
  });

  it.each(['collection', 'environment'] as const)('dispatches %s change notifications', async (entityType) => {
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
});
