import { ok, okNoContent } from '@/src/core/utils/api-response';
import { clearInternalProxyCache } from '@/src/modules/mock-proxy/mock-proxy.cache';

export type DatabaseActionContext = {
  now: string;
  respond: <T>(data: T, init?: ResponseInit) => Response;
  respondVoid: (init?: ResponseInit) => Response;
};

export function createDatabaseActionContext(now = new Date().toISOString()): DatabaseActionContext {
  return {
    now,
    respond: <T>(data: T, init?: ResponseInit) => {
      clearInternalProxyCache();
      return ok(data, init);
    },
    respondVoid: (init?: ResponseInit) => {
      clearInternalProxyCache();
      return okNoContent(init);
    },
  };
}
