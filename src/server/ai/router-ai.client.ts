/**
 * Router AI Client for Mock API Studio
 * Integrates with router-ai gateway (OpenAI-compatible chat completions & models API)
 * Supports dynamic model listing, streaming responses with reasoning/thinking stream,
 * and multi-key fallback handling.
 */

import { apiKeyManager } from './api-key-manager';
import {
  AiModelDefinition,
  STATIC_AI_MODELS,
  DEFAULT_AI_MODEL,
  inferModelMetadata,
} from '@/src/core/constants/ai-models';

export interface RouterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChatOptions {
  model?: string;
  messages: RouterChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  apiKey?: string;
  onReasoning?: (delta: string) => void;
  onContent?: (delta: string) => void;
  signal?: AbortSignal;
}

export class RouterAiClient {
  /**
   * Get clean base URL without trailing slash or /v1 suffix
   */
  public getBaseUrl(): string {
    let raw = process.env.ROUTER_AI_BASE_URL || 'http://localhost:20127';
    raw = raw.trim().replace(/\/+$/, '');
    if (raw.endsWith('/v1')) {
      raw = raw.slice(0, -3);
    }
    return raw;
  }

  /**
   * Check if Router AI is reachable and online
   */
  public async checkHealth(): Promise<{ online: boolean; url: string; message?: string }> {
    const baseUrl = this.getBaseUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(async () => {
        // Fallback to GET /v1/models if /api/health is unavailable
        return await fetch(`${baseUrl}/v1/models`, {
          method: 'GET',
          signal: controller.signal,
        });
      });

      clearTimeout(timeoutId);

      if (res && (res.ok || res.status === 401)) {
        return { online: true, url: baseUrl };
      }
      return { online: false, url: baseUrl, message: `HTTP status ${res?.status || 'Unknown'}` };
    } catch (err: any) {
      return {
        online: false,
        url: baseUrl,
        message: err.name === 'AbortError' ? 'Koneksi timeout (2.5s)' : err.message,
      };
    }
  }

  /**
   * Check if any API key or Router AI connection is configured
   */
  public async isConfigured(customKey?: string): Promise<boolean> {
    if (customKey && customKey.trim().length > 3) return true;
    const keys = await apiKeyManager.getActiveKeysWithFallback('ROUTER_AI');
    if (keys.length > 0) return true;

    // Check if router is responding without key requirement
    const health = await this.checkHealth();
    return health.online;
  }

  /**
   * Fetch available models dynamically from Router AI (/v1/models)
   */
  public async getAvailableModels(): Promise<{
    models: AiModelDefinition[];
    isOnline: boolean;
    defaultModel: string;
    routerUrl: string;
  }> {
    const baseUrl = this.getBaseUrl();
    const fallbackList = Object.values(STATIC_AI_MODELS);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Attempt with Authorization header if candidate key exists
      const keys = await apiKeyManager.getActiveKeysWithFallback('ROUTER_AI');
      const authHeader = keys.length > 0 ? { Authorization: `Bearer ${keys[0].key}` } : {};

      const response = await fetch(`${baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          models: fallbackList,
          isOnline: false,
          defaultModel: DEFAULT_AI_MODEL,
          routerUrl: baseUrl,
        };
      }

      const data = await response.json();
      const modelItems = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.models)
        ? data.models
        : [];

      if (modelItems.length === 0) {
        return {
          models: fallbackList,
          isOnline: true,
          defaultModel: DEFAULT_AI_MODEL,
          routerUrl: baseUrl,
        };
      }

      const mappedModels: AiModelDefinition[] = modelItems.map((item: any) => {
        const id = typeof item === 'string' ? item : item.id;
        return inferModelMetadata(id);
      });

      // Deduplicate by id
      const seen = new Set<string>();
      const deduped: AiModelDefinition[] = [];
      for (const m of mappedModels) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          deduped.push(m);
        }
      }

      const defaultModel = deduped.find((m) => m.id === DEFAULT_AI_MODEL)
        ? DEFAULT_AI_MODEL
        : deduped[0]?.id || DEFAULT_AI_MODEL;

      return {
        models: deduped,
        isOnline: true,
        defaultModel,
        routerUrl: baseUrl,
      };
    } catch {
      return {
        models: fallbackList,
        isOnline: false,
        defaultModel: DEFAULT_AI_MODEL,
        routerUrl: baseUrl,
      };
    }
  }

  /**
   * Streaming completion generator with automatic fallback
   */
  public async *streamChat(options: StreamChatOptions): AsyncGenerator<{
    type: 'reasoning' | 'content' | 'done' | 'error';
    text?: string;
    model?: string;
    keyName?: string;
  }> {
    const baseUrl = this.getBaseUrl();
    const modelId = options.model || DEFAULT_AI_MODEL;
    const modelDef = inferModelMetadata(modelId);

    // Determine candidate keys
    let candidateKeys: Array<{ id: string; name: string; key: string }> = [];
    if (options.apiKey && options.apiKey.trim().length > 3) {
      candidateKeys = [{ id: 'custom-key', name: 'Custom Provided Key', key: options.apiKey.trim() }];
    } else {
      candidateKeys = await apiKeyManager.getActiveKeysWithFallback('ROUTER_AI');
    }

    // Router AI often works without an API key if REQUIRE_API_KEY=false
    if (candidateKeys.length === 0) {
      candidateKeys = [{ id: 'direct-router', name: 'Router AI (Direct)', key: '' }];
    }

    const payload: Record<string, any> = {
      model: modelId,
      messages: options.messages,
      temperature: options.temperature ?? 0.5,
      top_p: options.top_p ?? 0.95,
      max_tokens: options.max_tokens ?? 4096,
      stream: true,
    };

    if (modelDef.supportsReasoning) {
      payload.extra_body = {
        chat_template_kwargs: {
          enable_thinking: true,
        },
      };
    }

    let lastErrorMsg = '';

    for (let i = 0; i < candidateKeys.length; i++) {
      const candidate = candidateKeys[i];
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      };
      if (candidate.key) {
        headers['Authorization'] = `Bearer ${candidate.key}`;
      }

      try {
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: options.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const parsed = JSON.parse(errorText);
            if (parsed?.error?.message) {
              errorMsg = parsed.error.message;
            } else if (parsed?.message) {
              errorMsg = parsed.message;
            }
          } catch {
            if (errorText) errorMsg += ` - ${errorText.substring(0, 150)}`;
          }

          if (candidate.id !== 'direct-router') {
            await apiKeyManager.recordFailure(candidate.id, errorMsg);
          }
          lastErrorMsg = `[${candidate.name}] ${errorMsg}`;

          if (i < candidateKeys.length - 1) {
            console.warn(`Fallback triggered: ${candidate.name} gagal (${errorMsg}), mencoba fallback berikutnya...`);
            continue;
          }

          yield {
            type: 'error',
            text: `Gagal memproses request ke Router AI (${baseUrl}): ${lastErrorMsg}`,
            model: modelId,
          };
          return;
        }

        if (!response.body) {
          if (candidate.id !== 'direct-router') {
            await apiKeyManager.recordFailure(candidate.id, 'No response body');
          }
          if (i < candidateKeys.length - 1) continue;
          yield { type: 'error', text: 'Tidak ada respons body dari server Router AI', model: modelId };
          return;
        }

        if (candidate.id !== 'direct-router') {
          await apiKeyManager.recordSuccess(candidate.id);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;
              if (trimmed === 'data: [DONE]') {
                yield { type: 'done', model: modelId, keyName: candidate.name };
                return;
              }

              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.substring(6);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const choice = parsed.choices?.[0];
                  if (!choice) continue;

                  // Reasoning / Thinking delta (DeepSeek R1, Nemotron, Claude, etc.)
                  const reasoning =
                    choice.delta?.reasoning_content ||
                    choice.delta?.reasoning ||
                    choice.delta?.thinking;
                  if (reasoning) {
                    yield { type: 'reasoning', text: reasoning, model: modelId, keyName: candidate.name };
                  }

                  // Content delta
                  const content = choice.delta?.content;
                  if (content) {
                    yield { type: 'content', text: content, model: modelId, keyName: candidate.name };
                  }
                } catch {
                  // Ignore partial frames
                }
              }
            }
          }
          yield { type: 'done', model: modelId, keyName: candidate.name };
          return;
        } finally {
          reader.releaseLock();
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        if (candidate.id !== 'direct-router') {
          await apiKeyManager.recordFailure(candidate.id, err.message);
        }
        lastErrorMsg = err.message;
        if (i < candidateKeys.length - 1) {
          continue;
        }

        const isConnRefused =
          err.code === 'ECONNREFUSED' ||
          err.message?.includes('ECONNREFUSED') ||
          err.message?.includes('fetch failed');

        const message = isConnRefused
          ? `Tidak dapat terhubung ke Router AI di "${baseUrl}". Pastikan server router-ai telah dijalankan (mis. port 20127) atau atur ROUTER_AI_BASE_URL yang sesuai di .env.`
          : `Gagal memproses request ke Router AI: ${lastErrorMsg}`;

        yield { type: 'error', text: message, model: modelId };
        return;
      }
    }
  }
}

export const routerAiClient = new RouterAiClient();

