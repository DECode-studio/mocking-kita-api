import { NextResponse } from 'next/server';
import openApiSpecJson from '@/docs/external-api-postman-openapi.json';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(openApiSpecJson, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  });
}
