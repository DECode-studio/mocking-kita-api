export interface AiModelDefinition {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextWindow: number;
  supportsReasoning: boolean;
  recommendedFor: string;
  badge: string;
}

// Backward-compatibility alias
export type NimModelDefinition = AiModelDefinition;

export const DEFAULT_AI_MODEL = process.env.ROUTER_AI_COMBO || 'combo-gemini';
export const DEFAULT_NIM_MODEL = DEFAULT_AI_MODEL;

export const STATIC_AI_MODELS: Record<string, AiModelDefinition> = {
  'combo-gemini': {
    id: 'combo-gemini',
    name: 'combo-gemini',
    provider: 'Google / Router AI',
    description: 'Model combo-gemini melalui Router AI gateway.',
    contextWindow: 65536,
    supportsReasoning: false,
    recommendedFor: 'Tanya Jawab, Navigasi Fitur, & Analisis Cepat',
    badge: '✨ Gemini',
  },
  'deepseek-ai/deepseek-v4.1-flash': {
    id: 'deepseek-ai/deepseek-v4.1-flash',
    name: 'DeepSeek v4.1 Flash',
    provider: 'DeepSeek / Router AI',
    description: 'Model super cepat dengan reasoning tingkat tinggi untuk dialog teknis & konversi schema.',
    contextWindow: 128000,
    supportsReasoning: true,
    recommendedFor: 'Tanya Jawab, Navigasi Fitur, & Analisis Cepat',
    badge: '⚡ Ultra Fast',
  },
  'nvidia/nemotron-3-ultra-550b-a55b': {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'Nemotron 3 Ultra 550B',
    provider: 'NVIDIA / Router AI',
    description: 'Flagship 550B model dengan live reasoning stream untuk problem solving mendalam.',
    contextWindow: 65536,
    supportsReasoning: true,
    recommendedFor: 'Deep Reasoning, Arsitektur Kompleks, & Troubleshooting',
    badge: '🧠 Deep Reasoning',
  },
  'google/gemma-4-31b-it': {
    id: 'google/gemma-4-31b-it',
    name: 'Google Gemma 4 31B IT',
    provider: 'Google / Router AI',
    description: 'Model instruction-tuned 31B yang sangat presisi untuk coding dan panduan struktural.',
    contextWindow: 32768,
    supportsReasoning: false,
    recommendedFor: 'Code Generation & Precise Flow Guide',
    badge: '🎯 High Precision',
  },
  'z-ai/glm-5.3-flash': {
    id: 'z-ai/glm-5.3-flash',
    name: 'GLM 5.3 Flash',
    provider: 'Zhipu / Router AI',
    description: 'Model bilingual yang sangat responsif untuk chat instan dan konversi data.',
    contextWindow: 32768,
    supportsReasoning: false,
    recommendedFor: 'General Assistant & Quick FAQ',
    badge: '💬 Responsive',
  },
  'poolside/laguna-xs-2.1': {
    id: 'poolside/laguna-xs-2.1',
    name: 'Laguna XS 2.1',
    provider: 'Poolside / Router AI',
    description: 'Model spesialis software engineering, sintaksis API, dan JSON Schema templating.',
    contextWindow: 32768,
    supportsReasoning: false,
    recommendedFor: 'Schema Parsing & Scripting Assistance',
    badge: '🛠️ Code Specialist',
  },
};

// Backward-compatibility export
export const NIM_MODELS = STATIC_AI_MODELS;

/**
 * Helper to dynamically infer badge and metadata for any model returned by Router AI
 */
export function inferModelMetadata(modelId: string): AiModelDefinition {
  if (STATIC_AI_MODELS[modelId]) {
    return STATIC_AI_MODELS[modelId];
  }

  const lower = modelId.toLowerCase();
  let provider = 'Router AI';
  let badge = '🤖 AI Model';
  let supportsReasoning = false;
  let recommendedFor = 'General Chat & Assistance';

  if (lower.includes('deepseek')) {
    provider = 'DeepSeek';
    badge = '⚡ DeepSeek';
    supportsReasoning = lower.includes('r1') || lower.includes('reasoner');
  } else if (lower.includes('claude')) {
    provider = 'Anthropic';
    badge = '🎭 Claude';
    supportsReasoning = lower.includes('3-7') || lower.includes('sonnet');
    recommendedFor = 'Coding, Nuance, & Architecture';
  } else if (lower.includes('gpt') || lower.includes('openai') || lower.includes('o1') || lower.includes('o3')) {
    provider = 'OpenAI';
    badge = '🟢 OpenAI';
    supportsReasoning = lower.includes('o1') || lower.includes('o3');
    recommendedFor = 'General Problem Solving';
  } else if (lower.includes('gemini')) {
    provider = 'Google';
    badge = '✨ Gemini';
    supportsReasoning = lower.includes('flash-thinking') || lower.includes('pro');
    recommendedFor = 'Large Context & Multi-turn';
  } else if (lower.includes('nemotron')) {
    provider = 'NVIDIA';
    badge = '🧠 Nemotron';
    supportsReasoning = true;
    recommendedFor = 'Deep Reasoning';
  } else if (lower.includes('combo') || lower.includes('fusion')) {
    provider = 'Combo / Router';
    badge = '🔀 Multi-Combo';
    recommendedFor = 'Failover & High Availability';
  } else if (lower.includes('qoder') || lower.includes('kiro')) {
    provider = 'Kiro/Qoder';
    badge = '🛡️ IDE Model';
    recommendedFor = 'Code Assistance';
  }

  return {
    id: modelId,
    name: modelId.split('/').pop() || modelId,
    provider,
    description: `Model ${modelId} melalui Router AI gateway.`,
    contextWindow: 65536,
    supportsReasoning,
    recommendedFor,
    badge,
  };
}
