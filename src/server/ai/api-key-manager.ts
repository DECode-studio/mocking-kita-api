import prisma from '@/src/core/db/prisma-client';
import { encryptApiKey, decryptApiKey, createKeyHint } from './encryption';
import { DEFAULT_NIM_MODEL } from '@/src/core/constants/ai-models';

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
   * Retrieve all active API keys ordered by priority ASC, failureCount ASC
   * Also appends process.env.NVIDIA_API_KEY as final fallback if present.
   */
  public async getActiveKeysWithFallback(provider = 'NVIDIA_NIM'): Promise<DecryptedApiKeyRecord[]> {
    const records = await prisma.aiApiKey.findMany({
      where: {
        provider,
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
        if (plainKey && plainKey.trim().length > 5) {
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
    const envKey = process.env.NVIDIA_API_KEY?.trim();
    if (envKey && envKey.length > 5 && !decryptedList.some((k) => k.key === envKey)) {
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
    if (keyId === 'env-default-key') return;
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
    if (keyId === 'env-default-key') return;
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
  public async addKey(name: string, plainKey: string, priority = 1, provider = 'NVIDIA_NIM') {
    const trimmed = plainKey.trim();
    if (!trimmed || trimmed.length < 10) {
      throw new Error('API Key minimal 10 karakter.');
    }

    const encryptedKey = encryptApiKey(trimmed);
    const keyHint = createKeyHint(trimmed);

    return await prisma.aiApiKey.create({
      data: {
        name: name.trim() || 'NVIDIA NIM API Key',
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

    if (data.plainKey && data.plainKey.trim().length >= 10) {
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
  public async listKeys(provider = 'NVIDIA_NIM') {
    const keys = await prisma.aiApiKey.findMany({
      where: { provider },
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

    const envKey = process.env.NVIDIA_API_KEY?.trim();
    const hasEnvFallback = Boolean(envKey && envKey.length > 5);

    return {
      keys,
      hasEnvFallback,
      envKeyHint: hasEnvFallback ? createKeyHint(envKey!) : null,
    };
  }

  /**
   * Test an API key by making a lightweight ping to NVIDIA NIM
   */
  public async testKey(plainKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${plainKey.trim()}`,
        },
        body: JSON.stringify({
          model: DEFAULT_NIM_MODEL,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (res.ok) {
        return { success: true, message: 'Koneksi ke NVIDIA NIM berhasil! API Key valid.' };
      }

      const errText = await res.text();
      return { success: false, message: `NVIDIA NIM menolak kunci (HTTP ${res.status}): ${errText.substring(0, 150)}` };
    } catch (err: any) {
      return { success: false, message: `Gagal menghubungi server NVIDIA: ${err.message}` };
    }
  }
}

export const apiKeyManager = new AiApiKeyManager();
