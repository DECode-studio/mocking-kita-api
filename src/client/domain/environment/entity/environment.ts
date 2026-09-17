import { EnvironmentType } from '@/src/core/utils/types';

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  environmentType: EnvironmentType;
  baseUrl: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
