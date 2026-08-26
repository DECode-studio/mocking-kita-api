import { NextResponse } from 'next/server';
import { GOOGLE_OAUTH_API } from '@/src/core/constants/api';

function getRedirectUri(request: Request): string {
  const envAppUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envAppUrl) {
    const baseUrl = envAppUrl.replace(/\/$/, '');
    return `${baseUrl}/api/auth/sso/callback`;
  }
  const requestUrl = new URL(request.url);
  let host = requestUrl.host;
  if (host.includes('0.0.0.0')) {
    host = host.replace('0.0.0.0', 'localhost');
  }
  return `${requestUrl.protocol}//${host}/api/auth/sso/callback`;
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const redirectUri = getRedirectUri(request);

  if (!clientId || !clientSecret) {
    return new Response('Google Workspace SSO is not configured on this server.', { status: 501 });
  }

  // Real Google OAuth Redirect
  const googleAuthUrl = `${GOOGLE_OAUTH_API.AUTHORIZE}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
  return NextResponse.redirect(googleAuthUrl);
}
