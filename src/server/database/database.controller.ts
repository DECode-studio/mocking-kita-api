import { handleDatabaseGet, handleDatabasePost } from './database.service';

export async function GET() {
  return handleDatabaseGet();
}

export async function POST(request: Request) {
  return handleDatabasePost(request);
}
