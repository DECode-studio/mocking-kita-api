export type RemoteEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function unwrapRemoteData<T>(response: RemoteEnvelope<T>, fallback = 'Request failed'): T {
  if (!response.success) {
    throw new Error(response.error || fallback);
  }
  return response.data as T;
}
