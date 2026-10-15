import { AssistantKnowledgeItem, SaveKnowledgeInput } from '@/src/client/domain/assistant-knowledge/entity/knowledge_item';
import { KnowledgeRepository } from '@/src/client/domain/assistant-knowledge/repository/knowledge_repository';
import { KnowledgeRemoteDataSource } from '../data_source/knowledge_remote_data_source';

export class KnowledgeRepositoryImpl implements KnowledgeRepository {
  constructor(private readonly dataSource: KnowledgeRemoteDataSource) {}

  getItems(category?: 'product' | 'skill'): Promise<AssistantKnowledgeItem[]> {
    return this.dataSource.getItems(category);
  }

  getItem(type: 'product' | 'skill', id: string): Promise<AssistantKnowledgeItem | null> {
    return this.dataSource.getItem(type, id);
  }

  saveItem(item: SaveKnowledgeInput): Promise<AssistantKnowledgeItem> {
    return this.dataSource.saveItem(item);
  }

  deleteItem(type: 'product' | 'skill', id: string): Promise<boolean> {
    return this.dataSource.deleteItem(type, id);
  }

  importFile(type: 'product' | 'skill', file: File): Promise<{ success: boolean; message: string }> {
    return this.dataSource.importFile(type, file);
  }

  getExportUrl(type: 'product' | 'skill', id: string, asZip = false): string {
    return `/api/assistant/knowledge/export?type=${type}&id=${encodeURIComponent(id)}${asZip ? '&asZip=true' : ''}`;
  }

  getAllSkillsZipExportUrl(): string {
    return `/api/assistant/knowledge/export?allSkillsZip=true`;
  }
}

