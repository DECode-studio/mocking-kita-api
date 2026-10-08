import { NextRequest, NextResponse } from 'next/server';
import { apiKeyManager } from '@/src/server/ai/api-key-manager';
import { decryptApiKey } from '@/src/server/ai/encryption';
import prisma from '@/src/core/db/prisma-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, keyId } = body;

    let keyToTest = apiKey;

    if (!keyToTest && keyId) {
      if (keyId === 'env-default-key') {
        keyToTest = process.env.NVIDIA_API_KEY;
      } else {
        const record = await prisma.aiApiKey.findUnique({
          where: { id: keyId },
        });
        if (record) {
          keyToTest = decryptApiKey(record.encryptedKey);
        }
      }
    }

    if (!keyToTest || typeof keyToTest !== 'string') {
      return NextResponse.json(
        { error: 'API Key tidak ditemukan atau tidak valid' },
        { status: 400 }
      );
    }

    const testRes = await apiKeyManager.testKey(keyToTest);
    if (keyId && keyId !== 'env-default-key') {
      if (testRes.success) {
        await apiKeyManager.recordSuccess(keyId);
      } else {
        await apiKeyManager.recordFailure(keyId, testRes.message);
      }
    }

    return NextResponse.json(testRes);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal menguji API Key' },
      { status: 500 }
    );
  }
}
