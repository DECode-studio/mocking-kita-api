import { NextRequest } from 'next/server';
import { assistantKnowledgeController } from '@/src/server/assistant-knowledge';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return assistantKnowledgeController.importFile(req);
}

