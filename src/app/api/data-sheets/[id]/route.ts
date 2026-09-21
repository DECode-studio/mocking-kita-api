import { NextRequest } from 'next/server';
import {
  getDataSheetDetail,
  updateDataSheetHandler,
  deleteDataSheetHandler,
} from '@/src/server/data-sheet';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return getDataSheetDetail(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateDataSheetHandler(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return deleteDataSheetHandler(request, context);
}
