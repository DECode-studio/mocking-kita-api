import { NextResponse } from 'next/server';
import { GOOGLE_OAUTH_API } from '@/src/core/constants/api';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const requestUrl = new URL(request.url);
  const redirectUri = `${requestUrl.protocol}//${requestUrl.host}/api/auth/sso/callback`;

  if (!clientId || !clientSecret) {
    return new Response('Google Workspace SSO is not configured on this server.', { status: 501 });
  }

  // Real Google OAuth Redirect
  const googleAuthUrl = `${GOOGLE_OAUTH_API.AUTHORIZE}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
  return NextResponse.redirect(googleAuthUrl);
}
