import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { accountRepository } from '@/src/data/account/repository/account_repository_impl';
import { generateId } from '@/src/core/utils/uuid';
import { randomBytes } from 'node:crypto';
import { hashPassword } from '@/src/core/utils/password-hash';

const AUTH_COOKIE = 'mock-api-studio-auth';

function getSsoDomains(): string[] {
  const domainsStr = process.env.SSO_DOMAINS || '';
  return domainsStr
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const success = searchParams.get('success');

  let email = '';
  let name = '';

  const requestUrl = new URL(request.url);
  const redirectUri = `${requestUrl.protocol}//${requestUrl.host}/api/auth/sso/callback`;

  // Case 1: Real Google OAuth callback
  if (code) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return new Response('SSO config error: client ID or secret is missing', { status: 400 });
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        return new Response(`Token exchange failed: ${tokenData.error_description || tokenData.error}`, { status: 400 });
      }

      // Fetch user profile info
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const profileData = await profileResponse.json();
      if (!profileResponse.ok) {
        return new Response('Failed to retrieve user profile info', { status: 400 });
      }

      email = profileData.email?.toLowerCase();
      name = profileData.name || email.split('@')[0];
    } catch (err: any) {
      return new Response(`SSO Authentication error: ${err.message}`, { status: 500 });
    }
  }
  // Case 2: Mock redirect callback
  else if (success === 'true') {
    return new Response(getCloseScriptHtml(), {
      headers: { 'Content-Type': 'text/html' },
    });
  } else {
    return new Response('Invalid request parameters', { status: 400 });
  }

  // Domain whitelist check
  const domain = email.split('@')[1];
  const allowedDomains = getSsoDomains();

  if (allowedDomains.length > 0 && (!domain || !allowedDomains.includes(domain))) {
    return new Response(`Access Denied: Only whitelisted email domains are allowed to sign in. Allowed: ${allowedDomains.join(', ')}`, { status: 403 });
  }

  // Provision / retrieve account
  try {
    let account = await accountRepository.getByUsername(email);

    if (!account) {
      // Auto-provision Google SSO user
      const id = generateId();
      const randomPassword = randomBytes(32).toString('hex');
      const passwordHash = hashPassword(randomPassword);

      account = await accountRepository.create({
        id,
        username: email,
        passwordHash,
        name,
        role: 'Manager', // Default role
      });
    }

    const session = {
      username: account.username,
      name: account.name,
      role: account.role,
      token: `mock-jwt-token-${Date.now()}`,
      rememberMe: false,
      loginAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day session
    });

    return new Response(getCloseScriptHtml(), {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err: any) {
    return new Response(`Database provisioning error: ${err.message}`, { status: 500 });
  }
}

function getCloseScriptHtml() {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Authentication Successful</title>
</head>
<body style="background-color: #020617; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <div style="text-align: center;">
    <p style="font-size: 14px; font-weight: 500; margin-bottom: 5px;">SSO Authentication Successful!</p>
    <p style="font-size: 12px; color: #94a3b8; margin-top: 0;">Closing this window...</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage('sso-success', '*');
    }
    window.close();
  </script>
</body>
</html>
  `;
}
