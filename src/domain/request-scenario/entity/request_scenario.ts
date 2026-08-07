import { MatchType, RequestBodyType } from '@/src/core/utils/types';

export interface RequestScenario {
  id: string;
  apiId: string;
  name: string;
  description?: string;
  headers: Record<string, unknown>;
  queryParams: Record<string, unknown>;
  pathParams: Record<string, unknown>;
  body: unknown;
  bodyType: RequestBodyType;
  matchType: MatchType;
  priority: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
