import { PrismaClient } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ENV } from '@/src/core/constants/env';

function getDatabaseUrl(): string {
  if (ENV.DATABASE_URL) {
    return ENV.DATABASE_URL;
  }

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1];
        return match[1];
      }
    }
  } catch {}

  return 'postgresql://postgres:postgrespassword@localhost:5432/mock_api_studio?schema=public';
}

const dbUrl = getDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ENV.IS_DEVELOPMENT ? ['query', 'error', 'warn'] : ['error'],
  });

if (!ENV.IS_PRODUCTION) globalForPrisma.prisma = prisma;

export default prisma;
