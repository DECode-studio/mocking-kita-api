import { AssistantKnowledgeItem, SaveKnowledgeInput } from '@/src/client/domain/assistant-knowledge/entity/knowledge_item';

export interface KnowledgeRemoteDataSource {
  getItems(category?: 'product' | 'skill'): Promise<AssistantKnowledgeItem[]>;
  getItem(type: 'product' | 'skill', id: string): Promise<AssistantKnowledgeItem | null>;
  saveItem(item: SaveKnowledgeInput): Promise<AssistantKnowledgeItem>;
  deleteItem(type: 'product' | 'skill', id: string): Promise<boolean>;
  importFile(type: 'product' | 'skill', file: File): Promise<{ success: boolean; message: string }>;
}

