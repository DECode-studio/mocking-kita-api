import { NextRequest, NextResponse } from 'next/server';
import { apiKeyManager } from '@/src/server/ai/api-key-manager';
import { decryptApiKey } from '@/src/server/ai/encryption';
import prisma from '@/src/core/db/prisma-client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, keyId, testConnectionOnly } = body;

    let keyToTest = apiKey;

    if (!keyToTest && keyId) {
      if (keyId === 'env-default-key') {
        keyToTest = process.env.ROUTER_AI_API_KEY || process.env.NVIDIA_API_KEY;
      } else if (keyId !== 'test-connection') {
        const record = await prisma.aiApiKey.findUnique({
          where: { id: keyId },
        });
        if (record) {
          keyToTest = decryptApiKey(record.encryptedKey);
        }
      }
    }

    // If testConnectionOnly is true and no key is provided, we can test ping directly to Router AI
    if (!keyToTest && !testConnectionOnly && keyId !== 'test-connection') {
      return NextResponse.json(
        { error: 'API Key tidak ditemukan atau tidak valid' },
        { status: 400 }
      );
    }

    const testRes = await apiKeyManager.testKey(keyToTest);
    if (keyId && keyId !== 'env-default-key' && keyId !== 'test-connection') {
      if (testRes.success) {
        await apiKeyManager.recordSuccess(keyId);
      } else {
        await apiKeyManager.recordFailure(keyId, testRes.message);
      }
    }

    return NextResponse.json(testRes);
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Gagal menguji koneksi ke Router AI' },
      { status: 500 }
    );
  }
}
