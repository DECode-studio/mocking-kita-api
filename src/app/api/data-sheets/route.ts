import { NextRequest } from 'next/server';
import { listDataSheets, createDataSheetHandler } from '@/src/server/data-sheet';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return listDataSheets(request);
}

export async function POST(request: NextRequest) {
  return createDataSheetHandler(request);
}
