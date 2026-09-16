import { Account } from '@/src/client/domain/account/entity/account';

export function toAccountDomain(acc: {
  id: string;
  username: string;
  role: string;
  name: string;
  googleId?: string | null;
  hasCustomPassword?: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Account {
  return {
    id: acc.id,
    username: acc.username,
    role: acc.role as any,
    name: acc.name,
    googleId: acc.googleId || null,
    hasCustomPassword: Boolean(acc.hasCustomPassword),
    createdAt: acc.createdAt.toISOString(),
    updatedAt: acc.updatedAt.toISOString(),
  };
}

