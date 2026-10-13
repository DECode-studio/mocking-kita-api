/**
 * Backward compatibility bridge:
 * Redirects previous NvidiaNimClient to the new RouterAiClient
 */

import { routerAiClient, RouterAiClient, RouterChatMessage, StreamChatOptions } from './router-ai.client';
import {
  NIM_MODELS,
  DEFAULT_NIM_MODEL,
  AiModelDefinition,
  NimModelDefinition,
} from '@/src/core/constants/ai-models';

export { NIM_MODELS, DEFAULT_NIM_MODEL };
export type { NimModelDefinition, AiModelDefinition };
export type NimChatMessage = RouterChatMessage;
export type { StreamChatOptions };

export const NvidiaNimClient = RouterAiClient;
export const nimClient = routerAiClient;
