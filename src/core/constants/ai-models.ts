export interface NimModelDefinition {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextWindow: number;
  supportsReasoning: boolean;
  recommendedFor: string;
  badge: string;
}

export const NIM_MODELS: Record<string, NimModelDefinition> = {
  'deepseek-ai/deepseek-v4.1-flash': {
    id: 'deepseek-ai/deepseek-v4.1-flash',
    name: 'DeepSeek v4.1 Flash',
    provider: 'DeepSeek / NVIDIA NIM',
    description: 'Model super cepat dengan reasoning tingkat tinggi untuk dialog teknis & konversi schema.',
    contextWindow: 128000,
    supportsReasoning: false,
    recommendedFor: 'Tanya Jawab, Navigasi Fitur, & Analisis Cepat',
    badge: '⚡ Ultra Fast',
  },
  'nvidia/nemotron-3-ultra-550b-a55b': {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'Nemotron 3 Ultra 550B',
    provider: 'NVIDIA',
    description: 'Flagship 550B model dengan live reasoning stream untuk problem solving mendalam.',
    contextWindow: 65536,
    supportsReasoning: true,
    recommendedFor: 'Deep Reasoning, Arsitektur Kompleks, & Troubleshooting',
    badge: '🧠 Deep Reasoning',
  },
  'google/gemma-4-31b-it': {
    id: 'google/gemma-4-31b-it',
    name: 'Google Gemma 4 31B IT',
    provider: 'Google / NVIDIA NIM',
    description: 'Model instruction-tuned 31B yang sangat presisi untuk coding dan panduan struktural.',
    contextWindow: 32768,
    supportsReasoning: false,
    recommendedFor: 'Code Generation & Precise Flow Guide',
    badge: '🎯 High Precision',
  },
  'z-ai/glm-5.3-flash': {
    id: 'z-ai/glm-5.3-flash',
    name: 'GLM 5.3 Flash',
    provider: 'Zhipu / NVIDIA NIM',
    description: 'Model bilingual yang sangat responsif untuk chat instan dan konversi data.',
    contextWindow: 32768,
    supportsReasoning: false,
    recommendedFor: 'General Assistant & Quick FAQ',
    badge: '💬 Responsive',
  },
  'poolside/laguna-xs-2.1': {
    id: 'poolside/laguna-xs-2.1',
    name: 'Laguna XS 2.1',
    provider: 'Poolside / NVIDIA NIM',
    description: 'Model spesialis software engineering, sintaksis API, dan JSON Schema templating.',
    contextWindow: 32768,
    supportsReasoning: false,
    recommendedFor: 'Schema Parsing & Scripting Assistance',
    badge: '🛠️ Code Specialist',
  },
};

export const DEFAULT_NIM_MODEL = 'poolside/laguna-xs-2.1';
