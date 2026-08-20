import { cookies } from 'next/headers';
import { accountRepository } from '@/src/data/account/repository/account_repository_impl';
import fs from 'node:fs';
import { ASSET_PATHS } from '@/src/core/constants/assets';
import { GOOGLE_OAUTH_API } from '@/src/core/constants/api';

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
      const tokenResponse = await fetch(GOOGLE_OAUTH_API.TOKEN, {
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
      const profileResponse = await fetch(GOOGLE_OAUTH_API.USER_INFO, {
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
      // If the account does not exist, render the profile completion HTML page from assets
      const { ROLES_LIST } = await import('@/src/core/constants/roles');
      const rolesOptions = ROLES_LIST.map(role => `<option value="${role}">${role}</option>`).join('');

      let html = fs.readFileSync(ASSET_PATHS.SSO_REGISTER_TEMPLATE, 'utf8');

      // Replace placeholders
      html = html
        .replaceAll('{{email}}', email)
        .replaceAll('{{name}}', name)
        .replaceAll('{{rolesOptions}}', rolesOptions);

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
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
  return fs.readFileSync(ASSET_PATHS.SSO_SUCCESS_TEMPLATE, 'utf8');
}
