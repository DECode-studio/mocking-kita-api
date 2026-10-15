import { NextRequest } from 'next/server';
import { assistantKnowledgeController } from '@/src/server/assistant-knowledge';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return assistantKnowledgeController.getItems(req);
}

export async function POST(req: NextRequest) {
  return assistantKnowledgeController.saveItem(req);
}

export async function DELETE(req: NextRequest) {
  return assistantKnowledgeController.deleteItem(req);
}

