/**
 * NVIDIA NIM Client with Multi-Key Fallback Engine
 * Handles streaming & non-streaming completions for NVIDIA NIM API models:
 * - deepseek-ai/deepseek-v4.1-flash (Default)
 * - nvidia/nemotron-3-ultra-550b-a55b (with Reasoning stream)
 * - google/gemma-4-31b-it
 * - z-ai/glm-5.3-flash
 * - poolside/laguna-xs-2.1
 */

import { apiKeyManager } from './api-key-manager';
import { NIM_MODELS, DEFAULT_NIM_MODEL, NimModelDefinition } from '@/src/core/constants/ai-models';

export { NIM_MODELS, DEFAULT_NIM_MODEL };
export type { NimModelDefinition };

export interface NimChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}


export interface StreamChatOptions {
  model?: string;
  messages: NimChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  apiKey?: string;
  onReasoning?: (delta: string) => void;
  onContent?: (delta: string) => void;
  signal?: AbortSignal;
}

export class NvidiaNimClient {
  private baseUrl = 'https://integrate.api.nvidia.com/v1';

  /**
   * Check if any API key is configured (database or .env)
   */
  public async isConfigured(customKey?: string): Promise<boolean> {
    if (customKey && customKey.trim().length > 5) return true;
    const keys = await apiKeyManager.getActiveKeysWithFallback();
    return keys.length > 0;
  }

  /**
   * Streaming completion generator with automatic multi-key fallback
   */
  public async *streamChat(options: StreamChatOptions): AsyncGenerator<{
    type: 'reasoning' | 'content' | 'done' | 'error';
    text?: string;
    model?: string;
    keyName?: string;
  }> {
    const modelId = options.model && NIM_MODELS[options.model] ? options.model : DEFAULT_NIM_MODEL;
    const modelDef = NIM_MODELS[modelId] || NIM_MODELS[DEFAULT_NIM_MODEL];

    // Determine candidate keys
    let candidateKeys: Array<{ id: string; name: string; key: string }> = [];
    if (options.apiKey && options.apiKey.trim().length > 5) {
      candidateKeys = [{ id: 'custom-key', name: 'Custom Provided Key', key: options.apiKey.trim() }];
    } else {
      candidateKeys = await apiKeyManager.getActiveKeysWithFallback('NVIDIA_NIM');
    }

    if (candidateKeys.length === 0) {
      yield {
        type: 'error',
        text: 'Belum ada NVIDIA API Key yang dikonfigurasi. Silakan tambahkan API Key di menu Settings > AI & NIM API Keys atau di file .env.',
        model: modelId,
      };
      return;
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

    // Iterate through candidate keys (Fallback mechanism)
    for (let i = 0; i < candidateKeys.length; i++) {
      const candidate = candidateKeys[i];

      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${candidate.key}`,
            Accept: 'text/event-stream',
          },
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
            }
          } catch {
            if (errorText) errorMsg += ` - ${errorText.substring(0, 150)}`;
          }

          // Record failure on this key
          await apiKeyManager.recordFailure(candidate.id, errorMsg);
          lastErrorMsg = `[Key: ${candidate.name}] ${errorMsg}`;

          // If there is another fallback key available, continue to next key!
          if (i < candidateKeys.length - 1) {
            console.warn(`Fallback triggered: Key "${candidate.name}" gagal (${errorMsg}), mencoba fallback key berikutnya...`);
            continue;
          }

          // All keys exhausted
          yield { type: 'error', text: `Semua API Key gagal. Terakhir: ${lastErrorMsg}`, model: modelId };
          return;
        }

        if (!response.body) {
          await apiKeyManager.recordFailure(candidate.id, 'No response body');
          if (i < candidateKeys.length - 1) continue;
          yield { type: 'error', text: 'Tidak ada respons body dari server NVIDIA', model: modelId };
          return;
        }

        // Key worked successfully!
        await apiKeyManager.recordSuccess(candidate.id);

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

                  // Reasoning delta (Nemotron)
                  const reasoning = choice.delta?.reasoning_content || choice.delta?.reasoning;
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
          return; // Successfully completed
        } finally {
          reader.releaseLock();
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        await apiKeyManager.recordFailure(candidate.id, err.message);
        lastErrorMsg = `[Key: ${candidate.name}] ${err.message}`;
        if (i < candidateKeys.length - 1) {
          continue;
        }
        yield { type: 'error', text: `Gagal memproses request: ${lastErrorMsg}`, model: modelId };
        return;
      }
    }
  }
}

export const nimClient = new NvidiaNimClient();
