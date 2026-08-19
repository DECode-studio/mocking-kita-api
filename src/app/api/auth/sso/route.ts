import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const requestUrl = new URL(request.url);
  const redirectUri = `${requestUrl.protocol}//${requestUrl.host}/api/auth/sso/callback`;

  if (clientId && clientSecret) {
    // Real Google OAuth Redirect
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
    return NextResponse.redirect(googleAuthUrl);
  } else {
    // Redirect to Mock Google Sign-In Page
    const mockUrl = `${requestUrl.protocol}//${requestUrl.host}/api/auth/sso/mock`;
    return NextResponse.redirect(mockUrl);
  }
}
