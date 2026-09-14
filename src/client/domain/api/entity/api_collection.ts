import { MethodRequest } from '@/src/core/utils/types';
import { Account } from '@/src/client/domain/account/entity/account';

export interface ApiCollection {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  path: string;
  methodRequest: MethodRequest;
  picIds?: string[];
  pics?: Account[];
  status: boolean;
  collectionId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

