import { NextRequest } from 'next/server';
import { assistantKnowledgeController } from '@/src/server/assistant-knowledge';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return assistantKnowledgeController.exportItem(req);
}

