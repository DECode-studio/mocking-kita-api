import { Account } from '@/src/client/domain/account/entity/account';

export interface Project {
  id: string;
  name: string;
  description?: string;
  picIds?: string[];
  pics?: Account[];
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

