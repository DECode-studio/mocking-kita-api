import prisma from '@/src/core/db/prisma-client';
import { verifyPassword } from '@/src/core/utils/password-hash';
import { ENV } from '@/src/core/constants/env';
import { signJwtToken } from './jwt.helper';

export interface ExternalSignInInput {
  email?: string;
  username?: string;
  password?: string;
}

export async function externalSignIn(input: ExternalSignInInput) {
  const loginIdentifier = (input.email || input.username || '').trim().toLowerCase();
  const password = (input.password || '').trim();

  if (!loginIdentifier || !password) {
    return {
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Email/username and password are required',
    };
  }

  // Check 1: App Admin Credentials (from ENV)
  if (ENV.APP_USERNAME && ENV.APP_PASSWORD && loginIdentifier === ENV.APP_USERNAME.toLowerCase() && password === ENV.APP_PASSWORD) {
    const userPayload = {
      sub: 'admin-system-id',
      username: ENV.APP_USERNAME,
      email: loginIdentifier.includes('@') ? loginIdentifier : undefined,
      role: 'ADMIN',
      name: 'System Administrator',
    };
    const token = signJwtToken(userPayload);
    return {
      success: true,
      status: 200,
      data: {
        tokenType: 'Bearer',
        accessToken: token,
        expiresIn: 86400,
        user: userPayload,
      },
    };
  }

  // Check 2: Database Account
  const account = await prisma.account.findFirst({
    where: {
      username: loginIdentifier,
    },
  });

  if (!account) {
    return {
      success: false,
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email/username or password',
    };
  }

  const isValidPassword = verifyPassword(password, account.password);
  if (!isValidPassword) {
    return {
      success: false,
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email/username or password',
    };
  }

  const userPayload = {
    sub: account.id,
    username: account.username,
    email: account.username.includes('@') ? account.username : undefined,
    role: account.role || 'MEMBER',
    name: account.name || account.username,
  };

  const token = signJwtToken(userPayload);

  return {
    success: true,
    status: 200,
    data: {
      tokenType: 'Bearer',
      accessToken: token,
      expiresIn: 86400,
      user: userPayload,
    },
  };
}
