import { NextResponse } from 'next/server';
import { NIM_MODELS, DEFAULT_NIM_MODEL, nimClient } from '@/src/server/ai/nvidia-nim.client';

export async function GET() {
  const models = Object.values(NIM_MODELS);
  const isConfigured = nimClient.isConfigured();

  return NextResponse.json({
    models,
    defaultModel: DEFAULT_NIM_MODEL,
    isConfigured,
  });
}
