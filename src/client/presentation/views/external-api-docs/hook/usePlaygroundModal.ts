import { useState, useEffect } from 'react';
import { ExternalEndpointSpec } from '../constant';

export function usePlaygroundModal(
  spec: ExternalEndpointSpec | null,
  authToken: string,
  apiKey: string,
  onAuthTokenChange: (val: string) => void
) {
  const [requestBodyText, setRequestBodyText] = useState('');
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [authHeaderType, setAuthHeaderType] = useState<'bearer' | 'apiKey'>('bearer');
  const [customApiKey, setCustomApiKey] = useState(apiKey || 'mock-studio-api-key');

  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (spec) {
      if (spec.requestBodyExample) {
        setRequestBodyText(JSON.stringify(spec.requestBodyExample, null, 2));
      } else {
        setRequestBodyText('');
      }

      const initialQueries: Record<string, string> = {};
      if (spec.queryParams) {
        spec.queryParams.forEach((q) => {
          if (q.example || q.defaultValue) {
            initialQueries[q.name] = q.example || q.defaultValue || '';
          }
        });
      }
      setQueryParams(initialQueries);
      setResponseStatus(null);
      setResponseTimeMs(null);
      setResponseData(null);
      setJsonError(null);
    }
  }, [spec]);

  const handleQueryChange = (key: string, value: string) => {
    setQueryParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleRunTest = async () => {
    if (!spec) return;

    setIsLoading(true);
    setJsonError(null);
    setResponseStatus(null);
    setResponseData(null);

    // Build URL with query params
    const url = spec.path;
    const urlObj = new URL(url, window.location.origin);
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v.trim()) {
        urlObj.searchParams.set(k, v.trim());
      }
    });

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (spec.requiresAuth) {
      if (authHeaderType === 'bearer' && authToken.trim()) {
        headers['Authorization'] = `Bearer ${authToken.trim()}`;
      } else if (authHeaderType === 'apiKey' && customApiKey.trim()) {
        headers['x-api-key'] = customApiKey.trim();
      }
    }

    // Parse Body if POST or PUT
    let bodyPayload: string | undefined = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(spec.method) && requestBodyText.trim()) {
      try {
        const parsed = JSON.parse(requestBodyText);
        bodyPayload = JSON.stringify(parsed);
      } catch {
        setJsonError('Invalid JSON format in Request Body');
        setIsLoading(false);
        return;
      }
    }

    const startTime = performance.now();
    try {
      const res = await fetch(urlObj.toString(), {
        method: spec.method,
        headers,
        body: bodyPayload,
      });

      const endTime = performance.now();
      setResponseTimeMs(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      const json = await res.json().catch(() => ({}));
      setResponseData(json);

      // Auto capture Bearer token if this was signin call
      if (spec.id === 'auth-signin' && json.success && json.data?.accessToken) {
        onAuthTokenChange(json.data.accessToken);
      }
    } catch (err: any) {
      const endTime = performance.now();
      setResponseTimeMs(Math.round(endTime - startTime));
      setResponseStatus(500);
      setResponseData({ success: false, error: { message: err?.message || 'Network error occurred' } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (responseData) {
      navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const methodColorClass = spec
    ? spec.method === 'GET'
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : spec.method === 'POST'
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : spec.method === 'PUT'
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    : '';

  return {
    requestBodyText,
    setRequestBodyText,
    queryParams,
    handleQueryChange,
    authHeaderType,
    setAuthHeaderType,
    customApiKey,
    setCustomApiKey,
    isLoading,
    responseStatus,
    responseTimeMs,
    responseData,
    copiedResponse,
    jsonError,
    handleRunTest,
    handleCopyResponse,
    methodColorClass,
  };
}
