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
  projectId?: string;
  userRole?: string;
  userName?: string;
  onReasoning?: (delta: string) => void;
  onContent?: (delta: string) => void;
  signal?: AbortSignal;
}

export interface RouterAiSkill {
  id: string;
  name: string;
  description?: string;
  content: string;
  keywords?: string[];
  enabled?: boolean;
  projectId?: string;
  type?: string;
  updatedAt?: string | Date;
  createdAt?: string | Date;
  [key: string]: unknown;
}

export interface RouterAiKnowledge {
  id: string | number;
  title: string;
  content?: string;
  source?: string;
  projectId?: string;
  updatedAt?: string | Date;
  createdAt?: string | Date;
  [key: string]: unknown;
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
   * Get default model configured via ROUTER_AI_COMBO environment variable
   */
  public getDefaultModel(): string {
    return (process.env.ROUTER_AI_COMBO || '').trim() || DEFAULT_AI_MODEL;
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
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : null;
      return {
        online: false,
        url: baseUrl,
        message: errorObj?.name === 'AbortError' ? 'Koneksi timeout (2.5s)' : (errorObj?.message || String(err)),
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
          defaultModel: this.getDefaultModel(),
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
          defaultModel: this.getDefaultModel(),
          routerUrl: baseUrl,
        };
      }

      const mappedModels: AiModelDefinition[] = modelItems.map((item: unknown) => {
        const id = typeof item === 'string'
          ? item
          : (item && typeof item === 'object' && 'id' in item ? String((item as Record<string, unknown>).id) : '');
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

      const defaultCombo = this.getDefaultModel();
      const defaultModel = deduped.find((m) => m.id === defaultCombo)
        ? defaultCombo
        : defaultCombo || DEFAULT_AI_MODEL;

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
        defaultModel: this.getDefaultModel(),
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
    const defaultModel = this.getDefaultModel();
    const modelId =
      options.model && options.model !== 'deepseek-ai/deepseek-v4.1-flash'
        ? options.model
        : defaultModel;
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

    const projectId = options.projectId || this.getProjectId();

    const payload: Record<string, unknown> = {
      model: modelId,
      messages: options.messages,
      temperature: options.temperature ?? 0.5,
      top_p: options.top_p ?? 0.95,
      max_tokens: options.max_tokens ?? 4096,
      stream: true,
      projectId,
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
        'x-project-id': projectId,
      };
      if (options.userRole) headers['x-user-role'] = options.userRole;
      if (options.userName) headers['x-user-name'] = options.userName;
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
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : (err && typeof err === 'object' ? (err as Record<string, unknown>) : null);
        const errName = errorObj && 'name' in errorObj ? String(errorObj.name) : '';
        const errMsg = errorObj && 'message' in errorObj && typeof errorObj.message === 'string' ? errorObj.message : String(err);
        const code = errorObj && 'code' in errorObj ? String(errorObj.code) : '';

        if (errName === 'AbortError') {
          return;
        }
        if (candidate.id !== 'direct-router') {
          await apiKeyManager.recordFailure(candidate.id, errMsg);
        }
        lastErrorMsg = errMsg;
        if (i < candidateKeys.length - 1) {
          continue;
        }

        const isConnRefused =
          code === 'ECONNREFUSED' ||
          errMsg.includes('ECONNREFUSED') ||
          errMsg.includes('fetch failed');

        const message = isConnRefused
          ? `Tidak dapat terhubung ke Router AI di "${baseUrl}". Pastikan server router-ai telah dijalankan (mis. port 20127) atau atur ROUTER_AI_BASE_URL yang sesuai di .env.`
          : `Gagal memproses request ke Router AI: ${lastErrorMsg}`;
        yield { type: 'error', text: message, model: modelId };
        return;
      }
    }
  }

  // ─── Project, Skill & Knowledge Management Methods ────────────────────────

  public getProjectId(): string {
    return (process.env.ROUTER_AI_PROJECT_ID || 'mock-api-studio').trim();
  }

  public getAuthHeaders(userRole = 'Administrator', userName = 'mock-api-studio'): Record<string, string> {
    const projectId = this.getProjectId();
    return {
      'x-project-id': projectId,
      'x-user-role': userRole,
      'x-user-name': userName,
      'Content-Type': 'application/json',
    };
  }

  public async getSkills(projectId = this.getProjectId()): Promise<RouterAiSkill[]> {
    const baseUrl = this.getBaseUrl();
    const url = projectId
      ? `${baseUrl}/api/agent-skill?projectId=${encodeURIComponent(projectId)}`
      : `${baseUrl}/api/agent-skill`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gagal memuat skills dari Router AI (${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data.skills) ? (data.skills as RouterAiSkill[]) : [];
  }

  public async getSkill(id: string): Promise<RouterAiSkill | null> {
    const skills = await this.getSkills();
    return skills.find((s) => s.id === id) || null;
  }

  public async saveSkill(input: {
    id?: string;
    name: string;
    description?: string;
    content: string;
    keywords?: string[];
    enabled?: boolean;
    projectId?: string;
  }): Promise<RouterAiSkill> {
    const baseUrl = this.getBaseUrl();
    const isUpdate = !!input.id;
    const url = isUpdate
      ? `${baseUrl}/api/agent-skill/${encodeURIComponent(input.id!)}`
      : `${baseUrl}/api/agent-skill`;
    const payload = {
      type: 'skill',
      name: input.name,
      description: input.description || '',
      content: input.content,
      keywords: input.keywords || [],
      enabled: input.enabled !== false,
      projectId: input.projectId || this.getProjectId(),
    };
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gagal menyimpan skill ke Router AI (${res.status})`);
    }
    return await res.json();
  }

  public async deleteSkill(id: string): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const res = await fetch(`${baseUrl}/api/agent-skill/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return res.ok;
  }

  public async getKnowledge(projectId = this.getProjectId()): Promise<RouterAiKnowledge[]> {
    const baseUrl = this.getBaseUrl();
    const url = projectId
      ? `${baseUrl}/api/agent-skill/knowledge?projectId=${encodeURIComponent(projectId)}`
      : `${baseUrl}/api/agent-skill/knowledge`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gagal memuat product knowledge dari Router AI (${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data) ? (data as RouterAiKnowledge[]) : [];
  }

  public async getKnowledgeItem(id: string): Promise<RouterAiKnowledge | null> {
    const baseUrl = this.getBaseUrl();
    const res = await fetch(`${baseUrl}/api/agent-skill/knowledge/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  }

  public async saveKnowledge(input: {
    id?: string;
    title: string;
    content: string;
    source?: string;
    projectId?: string;
  }): Promise<RouterAiKnowledge> {
    const baseUrl = this.getBaseUrl();
    const isUpdate = !!input.id;
    const url = isUpdate
      ? `${baseUrl}/api/agent-skill/knowledge/${encodeURIComponent(input.id!)}`
      : `${baseUrl}/api/agent-skill/knowledge`;
    const payload = {
      projectId: input.projectId || this.getProjectId(),
      title: input.title,
      content: input.content,
      source: input.source || 'Product Knowledge',
    };
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gagal menyimpan product knowledge ke Router AI (${res.status})`);
    }
    return await res.json();
  }

  public async deleteKnowledge(id: string): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const res = await fetch(`${baseUrl}/api/agent-skill/knowledge/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return res.ok;
  }

  public async importSkills(formData: FormData): Promise<Record<string, unknown>> {
    const baseUrl = this.getBaseUrl();
    const projectId = this.getProjectId();
    if (!formData.has('projectId')) {
      formData.append('projectId', projectId);
    }
    const res = await fetch(`${baseUrl}/api/agent-skill/import`, {
      method: 'POST',
      headers: {
        'x-project-id': projectId,
        'x-user-role': 'Administrator',
        'x-user-name': 'mock-api-studio',
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gagal import ke Router AI (${res.status})`);
    }
    return await res.json();
  }
}

export const routerAiClient = new RouterAiClient();

