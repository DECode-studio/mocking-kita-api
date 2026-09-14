import { NextRequest } from 'next/server';
import { GET as listProjects, POST as createProject } from '@/src/server/project/project.controller';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return listProjects(request);
}

export async function POST(request: NextRequest) {
  return createProject(request);
}
