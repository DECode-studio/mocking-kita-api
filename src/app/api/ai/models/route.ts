import { NextResponse } from 'next/server';
import { routerAiClient } from '@/src/server/ai/router-ai.client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await routerAiClient.getAvailableModels();
    const isConfigured = await routerAiClient.isConfigured();

    return NextResponse.json({
      models: result.models,
      defaultModel: result.defaultModel,
      isConfigured,
      isOnline: result.isOnline,
      routerUrl: result.routerUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        models: [],
        defaultModel: '',
        isConfigured: false,
        isOnline: false,
        error: error?.message || 'Gagal memuat model dari Router AI',
      },
      { status: 500 }
    );
  }
}
