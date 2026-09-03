import { accountRepository } from '@/src/modules/account';
import fs from 'node:fs';
import { ASSET_PATHS } from '@/src/core/constants/assets';
import { GOOGLE_OAUTH_API } from '@/src/core/constants/api';
import { ENV } from '@/src/core/constants/env';
import { setServerSession } from '@/src/core/server/auth/session';
import { logServerError } from '@/src/core/server/http/responses';
import { getRedirectUri } from './sso-utils';

function getSsoDomains(): string[] {
  return ENV.SSO_DOMAINS;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const success = searchParams.get('success');

  let email = '';
  let name = '';

  const redirectUri = getRedirectUri(request);

  // Case 1: Real Google OAuth callback
  if (code) {
    const clientId = ENV.GOOGLE_CLIENT_ID;
    const clientSecret = ENV.GOOGLE_CLIENT_SECRET;

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
        return new Response('Token exchange failed', { status: 400 });
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
    } catch (err) {
      logServerError('SSO authentication callback failed', err);
      return new Response('SSO Authentication error', { status: 500 });
    }
  }
  // Case 2: Registration success callback
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
      const { INITIAL_USER_ROLES } = await import('@/src/core/constants/roles');
      const rolesOptions = INITIAL_USER_ROLES.map(role => `<option value="${role}">${role}</option>`).join('');

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

    await setServerSession(session);

    return new Response(getCloseScriptHtml(), {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err) {
    logServerError('SSO database provisioning failed', err);
    return new Response('Database provisioning error', { status: 500 });
  }
}

function getCloseScriptHtml() {
  return fs.readFileSync(ASSET_PATHS.SSO_SUCCESS_TEMPLATE, 'utf8');
}
