import { NextResponse } from 'next/server';
import { verifyJwtToken, ExternalJwtPayload } from './jwt.helper';

export interface ExternalAuthResult {
  authenticated: boolean;
  user?: ExternalJwtPayload;
  response?: NextResponse;
}

export async function verifyExternalAuth(request: Request): Promise<ExternalAuthResult> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const apiKeyHeader = request.headers.get('x-api-key') || request.headers.get('X-API-Key');

  // Check 1: Bearer Token Auth
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifyJwtToken<ExternalJwtPayload>(token);
    if (verified) {
      return { authenticated: true, user: verified };
    }
  }

  // Check 2: API Key Header Auth
  const configuredApiKey = process.env.EXTERNAL_API_KEY || 'mock-studio-api-key';
  if (apiKeyHeader && apiKeyHeader.trim() === configuredApiKey.trim()) {
    return {
      authenticated: true,
      user: {
        sub: 'api-key-user',
        username: 'external-service',
        role: 'ADMIN',
        name: 'External Service API Key',
      },
    };
  }

  // Fallback: Check if Authorization header is raw API Key matching configured API key
  if (authHeader && authHeader.trim() === configuredApiKey.trim()) {
    return {
      authenticated: true,
      user: {
        sub: 'api-key-user',
        username: 'external-service',
        role: 'ADMIN',
        name: 'External Service API Key',
      },
    };
  }

  return {
    authenticated: false,
    response: NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing authentication token (Bearer token or x-api-key header required)',
        },
      },
      { status: 401 }
    ),
  };
}
