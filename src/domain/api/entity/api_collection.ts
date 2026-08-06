import { MethodRequest } from '@/src/core/utils/types';

export interface ApiCollection {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  path: string;
  methodRequest: MethodRequest;
  status: boolean;
  collectionId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
