import { Account } from '@/src/domain/account/entity/account';

export function toAccountDomain(acc: {
  id: string;
  username: string;
  role: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): Account {
  return {
    id: acc.id,
    username: acc.username,
    role: acc.role as any,
    name: acc.name,
    createdAt: acc.createdAt.toISOString(),
    updatedAt: acc.updatedAt.toISOString(),
  };
}
