import { NextRequest, NextResponse } from 'next/server';
import { apiKeyManager } from '@/src/server/ai/api-key-manager';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await apiKeyManager.listKeys('ROUTER_AI');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal mengambil daftar API Key' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, apiKey, priority } = body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 3) {
      return NextResponse.json(
        { error: 'API Key wajib diisi dan minimal 3 karakter' },
        { status: 400 }
      );
    }

    const created = await apiKeyManager.addKey(name || 'Router AI Key', apiKey, priority || 1, 'ROUTER_AI');
    return NextResponse.json({
      success: true,
      message: 'API Key berhasil disimpan dengan enkripsi AES-256-GCM',
      key: {
        id: created.id,
        name: created.name,
        keyHint: created.keyHint,
        priority: created.priority,
        isActive: created.isActive,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menyimpan API Key' },
      { status: 500 }
    );
  }
}
