import prisma from '@/src/core/db/prisma-client';
import { encryptApiKey, decryptApiKey, createKeyHint } from './encryption';

export interface DecryptedApiKeyRecord {
  id: string;
  name: string;
  provider: string;
  key: string;
  keyHint: string;
  priority: number;
  failureCount: number;
}

export class AiApiKeyManager {
  /**
   * Helper to get cleaned base URL of Router AI
   */
  private getRouterBaseUrl(): string {
    let raw = process.env.ROUTER_AI_BASE_URL || 'http://localhost:20127';
    raw = raw.trim().replace(/\/+$/, '');
    if (raw.endsWith('/v1')) {
      raw = raw.slice(0, -3);
    }
    return raw;
  }

  /**
   * Retrieve all active API keys ordered by priority ASC, failureCount ASC
   * Supports both ROUTER_AI and previous NVIDIA_NIM keys.
   * Also appends process.env.ROUTER_AI_API_KEY / process.env.NVIDIA_API_KEY as final fallback.
   */
  public async getActiveKeysWithFallback(provider = 'ROUTER_AI'): Promise<DecryptedApiKeyRecord[]> {
    // If provider is ROUTER_AI, match both ROUTER_AI and legacy NVIDIA_NIM
    const providerFilter =
      provider === 'ROUTER_AI'
        ? { in: ['ROUTER_AI', 'NVIDIA_NIM'] }
        : { equals: provider };

    const records = await prisma.aiApiKey.findMany({
      where: {
        provider: providerFilter,
        isActive: true,
      },
      orderBy: [
        { priority: 'asc' },
        { failureCount: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const decryptedList: DecryptedApiKeyRecord[] = [];

    for (const rec of records) {
      try {
        const plainKey = decryptApiKey(rec.encryptedKey);
        if (plainKey && plainKey.trim().length > 3) {
          decryptedList.push({
            id: rec.id,
            name: rec.name,
            provider: rec.provider,
            key: plainKey.trim(),
            keyHint: rec.keyHint,
            priority: rec.priority,
            failureCount: rec.failureCount,
          });
        }
      } catch (err) {
        console.error(`Gagal mendekripsi API key ID ${rec.id}:`, err);
      }
    }

    // Append .env fallback key if present and not already in database
    const envKey = (process.env.ROUTER_AI_API_KEY || process.env.NVIDIA_API_KEY)?.trim();
    if (envKey && envKey.length > 3 && !decryptedList.some((k) => k.key === envKey)) {
      decryptedList.push({
        id: 'env-default-key',
        name: 'Environment (.env) Fallback Key',
        provider,
        key: envKey,
        keyHint: createKeyHint(envKey),
        priority: 999,
        failureCount: 0,
      });
    }

    return decryptedList;
  }

  /**
   * Record successful usage of an API key
   */
  public async recordSuccess(keyId: string): Promise<void> {
    if (keyId === 'env-default-key' || keyId === 'direct-router') return;
    try {
      await prisma.aiApiKey.update({
        where: { id: keyId },
        data: {
          lastUsedAt: new Date(),
          failureCount: 0,
          lastError: null,
        },
      });
    } catch {
      // ignore
    }
  }

  /**
   * Record failure on an API key to facilitate automatic fallback
   */
  public async recordFailure(keyId: string, errorMsg: string): Promise<void> {
    if (keyId === 'env-default-key' || keyId === 'direct-router') return;
    try {
      await prisma.aiApiKey.update({
        where: { id: keyId },
        data: {
          failureCount: { increment: 1 },
          lastError: errorMsg.substring(0, 500),
          lastUsedAt: new Date(),
        },
      });
    } catch {
      // ignore
    }
  }

  /**
   * Add a new API key (stores encrypted in database)
   */
  public async addKey(name: string, plainKey: string, priority = 1, provider = 'ROUTER_AI') {
    const trimmed = plainKey.trim();
    if (!trimmed || trimmed.length < 3) {
      throw new Error('API Key minimal 3 karakter.');
    }

    const encryptedKey = encryptApiKey(trimmed);
    const keyHint = createKeyHint(trimmed);

    return await prisma.aiApiKey.create({
      data: {
        name: name.trim() || 'Router AI API Key',
        provider,
        encryptedKey,
        keyHint,
        priority: Number(priority) || 1,
        isActive: true,
      },
    });
  }

  /**
   * Update existing API key metadata or key value
   */
  public async updateKey(id: string, data: { name?: string; priority?: number; isActive?: boolean; plainKey?: string }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.priority !== undefined) updateData.priority = Number(data.priority);
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    if (data.plainKey && data.plainKey.trim().length >= 3) {
      updateData.encryptedKey = encryptApiKey(data.plainKey.trim());
      updateData.keyHint = createKeyHint(data.plainKey.trim());
      updateData.failureCount = 0;
      updateData.lastError = null;
    }

    return await prisma.aiApiKey.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete an API key
   */
  public async deleteKey(id: string) {
    return await prisma.aiApiKey.delete({
      where: { id },
    });
  }

  /**
   * List all stored keys (safe metadata with masked hints)
   */
  public async listKeys(provider = 'ROUTER_AI') {
    const providerFilter =
      provider === 'ROUTER_AI'
        ? { in: ['ROUTER_AI', 'NVIDIA_NIM'] }
        : { equals: provider };

    const keys = await prisma.aiApiKey.findMany({
      where: { provider: providerFilter },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        provider: true,
        keyHint: true,
        priority: true,
        isActive: true,
        lastUsedAt: true,
        failureCount: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const envKey = (process.env.ROUTER_AI_API_KEY || process.env.NVIDIA_API_KEY)?.trim();
    const hasEnvFallback = Boolean(envKey && envKey.length > 3);

    return {
      keys,
      hasEnvFallback,
      envKeyHint: hasEnvFallback ? createKeyHint(envKey!) : null,
      routerUrl: this.getRouterBaseUrl(),
    };
  }

  /**
   * Test an API key or connection against Router AI
   */
  public async testKey(plainKey?: string): Promise<{ success: boolean; message: string; routerUrl: string }> {
    const baseUrl = this.getRouterBaseUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (plainKey && plainKey.trim().length > 0) {
      headers['Authorization'] = `Bearer ${plainKey.trim()}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // First check GET /v1/models
      const res = await fetch(`${baseUrl}/v1/models`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const count = Array.isArray(data?.data) ? data.data.length : 'beberapa';
        return {
          success: true,
          message: `Koneksi ke Router AI (${baseUrl}) berhasil! Ditemukan ${count} model aktif.`,
          routerUrl: baseUrl,
        };
      }

      if (res.status === 401) {
        return {
          success: false,
          message: `Router AI menolak otentikasi (HTTP 401 Unauthorized). Pastikan API Key yang dimasukkan sesuai dengan API_KEY_SECRET pada router-ai.`,
          routerUrl: baseUrl,
        };
      }

      const errText = await res.text();
      return {
        success: false,
        message: `Router AI merespons status HTTP ${res.status}: ${errText.substring(0, 150)}`,
        routerUrl: baseUrl,
      };
    } catch (err: any) {
      const isConnRefused =
        err.code === 'ECONNREFUSED' ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('fetch failed');

      const message = isConnRefused
        ? `Tidak dapat terhubung ke Router AI di "${baseUrl}". Pastikan server router-ai telah aktif (npm run local di port 20127).`
        : `Gagal menghubungi server Router AI: ${err.message}`;

      return {
        success: false,
        message,
        routerUrl: baseUrl,
      };
    }
  }
}

export const apiKeyManager = new AiApiKeyManager();
