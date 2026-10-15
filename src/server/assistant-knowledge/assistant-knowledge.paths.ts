import * as path from 'node:path';
import { ENV } from '@/src/core/constants/env';

export function normalizeKnowledgePath(inputPath: string, defaultPath: string): string {
  const trimmed = inputPath?.trim() || '';
  if (!trimmed) return defaultPath;

  if (trimmed.startsWith('/.')) {
    return trimmed.slice(1);
  }

  return trimmed.replace(/\/+$/, '') || trimmed;
}

export function getSkillsDirectory(): string {
  const normalized = normalizeKnowledgePath(ENV.SKILLS_PATH, '.data/skills');
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), normalized);
}

export function getProductKnowledgeDirectory(): string {
  const normalized = normalizeKnowledgePath(ENV.PRODUCT_KNOWLEDGE_PATH, '.data/knowledge');
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), normalized);
}

export function getDirectoryForType(type: 'product' | 'skill'): string {
  return type === 'skill' ? getSkillsDirectory() : getProductKnowledgeDirectory();
}

